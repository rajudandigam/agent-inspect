import { readFile } from "node:fs/promises";

import {
  TraceReadError,
  openTrace,
  type TraceReadWarning,
} from "@agent-inspect/core/readers";
import {
  createSafetyOversizedAttributeRule,
  createSafetyRawContentRule,
  createSafetyRedactionRule,
  createSafetySecretPatternRule,
  runTraceChecks,
  type TraceCheckDiagnostic,
  type TraceCheckFinding,
  type TraceCheckRule,
} from "@agent-inspect/core/checks";
import {
  createRedactor,
  type RedactionDetector,
  type RedactionFinding,
  type RedactionProfile,
} from "@agent-inspect/redact";

import { redactTraceContent } from "./redact.js";
import type { CompiledRedactionPolicy } from "./redaction-policy.js";
import { loadRedactionPolicy } from "./redaction-policy.js";
import { inputFromTarget } from "./trace-input.js";

export interface SafetyCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  json?: boolean;
  explain?: boolean;
  maxStringLength?: string;
  maxArrayLength?: string;
  maxObjectKeys?: string;
  maxSerializedBytes?: string;
  /** Redaction profile used when deriving the artifact assessment (verify-safe). */
  redactionProfile?: RedactionProfile;
  /** Local JSON path for bounded custom redaction policy (#329). */
  policy?: string;
  /** Pre-compiled policy (tests / shared redact+verify path). */
  compiledPolicy?: CompiledRedactionPolicy;
}

type SafetyStatus = "SAFE" | "SAFE WITH WARNINGS" | "UNSAFE" | "UNKNOWN";
type SafetyCommandName = "scan" | "verify-safe";

/** Residual assessment status after redact (#328); underscore form for JSON stability. */
export type ResidualSafetyStatus =
  | "SAFE"
  | "SAFE_WITH_WARNINGS"
  | "UNSAFE"
  | "UNKNOWN";

/** Compact residual assessment: counts and codes only — never secret values. */
export interface ResidualSafetyAssessment {
  status: ResidualSafetyStatus;
  findings: number;
  warnings: number;
  errors: number;
  codes: string[];
  note: string;
}

interface SafetyDiagnostic {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

interface SafetySummary {
  findings: number;
  warnings: number;
  errors: number;
}

/** Compact layer status for source-vs-artifact reporting (6.9+). */
export interface SafetyLayerAssessment {
  status: SafetyStatus;
  summary: SafetySummary;
  findings: TraceCheckFinding[];
}

export interface SafetyRedactionSummary {
  profile: RedactionProfile;
  findings: number;
  detectors: string[];
}

interface SafetyResult {
  ok: boolean;
  command: SafetyCommandName;
  status: SafetyStatus;
  format: string;
  runId?: string;
  summary: SafetySummary;
  findings: TraceCheckFinding[];
  diagnostics: SafetyDiagnostic[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  note: string;
  /** Present on verify-safe when source and redacted-artifact assessments are both available. */
  sourceAssessment?: SafetyLayerAssessment;
  artifactAssessment?: SafetyLayerAssessment;
  redactionSummary?: SafetyRedactionSummary;
}

const BEST_EFFORT_NOTE =
  "Best-effort local safety verification only; not a compliance, privacy, security, or regulatory certification.";

const DEFAULT_MAX_STRING_LENGTH = 16_384;
const DEFAULT_MAX_ARRAY_LENGTH = 1_000;
const DEFAULT_MAX_OBJECT_KEYS = 200;
const DEFAULT_MAX_SERIALIZED_BYTES = 128 * 1024;

function parseLimit(value: string | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return parsed;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stable(record[key])]),
  );
}

function safetyDiagnostic(
  code: string,
  message: string,
  severity: SafetyDiagnostic["severity"] = "error",
): SafetyDiagnostic {
  return { code, message, severity };
}

function warningDiagnostics(
  warnings: readonly TraceReadWarning[],
  unsupportedFields: readonly string[],
): SafetyDiagnostic[] {
  return [
    ...warnings.map((warning) =>
      safetyDiagnostic(
        warning.code,
        warning.message,
        warning.severity === "error" ? "error" : "warning",
      ),
    ),
    ...unsupportedFields.map((field) =>
      safetyDiagnostic(
        "unsupported_field",
        `Reader reported unsupported field: ${field}`,
        "warning",
      ),
    ),
  ];
}

function diagnosticFromCheck(item: TraceCheckDiagnostic): SafetyDiagnostic {
  return safetyDiagnostic(item.code, item.message, item.severity);
}

function statusFrom(
  findings: readonly TraceCheckFinding[],
  diagnostics: readonly SafetyDiagnostic[],
): SafetyStatus {
  if (diagnostics.some((item) => item.severity === "error")) return "UNKNOWN";
  if (findings.some((item) => item.severity === "error")) return "UNSAFE";
  if (diagnostics.some((item) => item.severity === "warning")) return "SAFE WITH WARNINGS";
  if (findings.some((item) => item.severity === "warning")) return "SAFE WITH WARNINGS";
  return "SAFE";
}

function resultFromParts(parts: {
  command: SafetyCommandName;
  format: string;
  runId?: string;
  findings?: readonly TraceCheckFinding[];
  diagnostics?: readonly SafetyDiagnostic[];
  warnings?: readonly TraceReadWarning[];
  unsupportedFields?: readonly string[];
  sourceAssessment?: SafetyLayerAssessment;
  artifactAssessment?: SafetyLayerAssessment;
  redactionSummary?: SafetyRedactionSummary;
  /** When set, overrides status derived from findings (used for artifact-gated verify-safe). */
  status?: SafetyStatus;
}): SafetyResult {
  const findings = [...(parts.findings ?? [])];
  const diagnostics = [...(parts.diagnostics ?? [])];
  const warnings = [...(parts.warnings ?? [])];
  const unsupportedFields = [...(parts.unsupportedFields ?? [])];
  const status = parts.status ?? statusFrom(findings, diagnostics);
  return {
    ok: status === "SAFE" || status === "SAFE WITH WARNINGS",
    command: parts.command,
    status,
    format: parts.format,
    ...(parts.runId !== undefined ? { runId: parts.runId } : {}),
    summary: {
      findings: findings.length,
      warnings:
        diagnostics.filter((item) => item.severity === "warning").length +
        findings.filter((item) => item.severity === "warning").length,
      errors:
        diagnostics.filter((item) => item.severity === "error").length +
        findings.filter((item) => item.severity === "error").length,
    },
    findings,
    diagnostics,
    warnings,
    unsupportedFields,
    note: BEST_EFFORT_NOTE,
    ...(parts.sourceAssessment !== undefined
      ? { sourceAssessment: parts.sourceAssessment }
      : {}),
    ...(parts.artifactAssessment !== undefined
      ? { artifactAssessment: parts.artifactAssessment }
      : {}),
    ...(parts.redactionSummary !== undefined
      ? { redactionSummary: parts.redactionSummary }
      : {}),
  };
}

function layerFromResult(result: SafetyResult): SafetyLayerAssessment {
  return {
    status: result.status,
    summary: result.summary,
    findings: result.findings,
  };
}

function readErrorResult(
  command: SafetyCommandName,
  error: unknown,
): SafetyResult {
  if (error instanceof TraceReadError) {
    const code =
      error.code === "unsupported_format"
        ? "AI_SAFETY_UNSUPPORTED_FORMAT"
        : error.code === "ambiguous_format"
          ? "AI_SAFETY_AMBIGUOUS_FORMAT"
          : "AI_SAFETY_TRACE_UNREADABLE";
    return resultFromParts({
      command,
      format: "unknown",
      diagnostics: [safetyDiagnostic(code, error.message)],
      warnings: error.warnings,
    });
  }
  return resultFromParts({
    command,
    format: "unknown",
    diagnostics: [
      safetyDiagnostic(
        "AI_SAFETY_TRACE_UNREADABLE",
        error instanceof Error ? error.message : String(error),
      ),
    ],
  });
}

function invalidArgumentResult(
  command: SafetyCommandName,
  error: unknown,
): SafetyResult {
  return resultFromParts({
    command,
    format: "unknown",
    diagnostics: [
      safetyDiagnostic(
        "AI_SAFETY_INVALID_ARGUMENTS",
        error instanceof Error ? error.message : String(error),
      ),
    ],
  });
}

function buildSafetyRules(options: SafetyCommandOptions): TraceCheckRule[] {
  const maxStringLength =
    parseLimit(options.maxStringLength, "--max-string-length") ?? DEFAULT_MAX_STRING_LENGTH;
  const maxArrayLength =
    parseLimit(options.maxArrayLength, "--max-array-length") ?? DEFAULT_MAX_ARRAY_LENGTH;
  const maxObjectKeys =
    parseLimit(options.maxObjectKeys, "--max-object-keys") ?? DEFAULT_MAX_OBJECT_KEYS;
  const maxSerializedBytes =
    parseLimit(options.maxSerializedBytes, "--max-serialized-bytes") ??
    DEFAULT_MAX_SERIALIZED_BYTES;

  return [
    createSafetyRawContentRule(),
    createSafetyRedactionRule(),
    createSafetySecretPatternRule(),
    createSafetyOversizedAttributeRule({
      maxStringLength,
      maxArrayLength,
      maxObjectKeys,
      maxSerializedBytes,
    }),
  ];
}

function flattenNodes(
  nodes: readonly {
    event: {
      eventId: string;
      runId: string;
      parentId?: string;
      kind: string;
      name: string;
      status?: string;
      attributes?: Record<string, unknown>;
    };
    children: readonly unknown[];
  }[],
): {
  event: {
    eventId: string;
    runId: string;
    parentId?: string;
    kind: string;
    name: string;
    status?: string;
    attributes?: Record<string, unknown>;
  };
  children: readonly unknown[];
}[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenNodes(
      node.children as readonly {
        event: {
          eventId: string;
          runId: string;
          parentId?: string;
          kind: string;
          name: string;
          status?: string;
          attributes?: Record<string, unknown>;
        };
        children: readonly unknown[];
      }[],
    ),
  ]);
}

function detectorSeverity(finding: RedactionFinding): TraceCheckFinding["severity"] {
  return finding.severity;
}

function classifyRedactionDetector(detector: string): {
  category: NonNullable<TraceCheckFinding["category"]>;
  confidence: NonNullable<TraceCheckFinding["confidence"]>;
} {
  if (
    detector === "value.creditCard" ||
    detector === "value.email" ||
    detector === "value.phone"
  ) {
    return { category: "personal-data", confidence: "high" };
  }
  if (detector === "value.ipv4" || detector === "value.ipv6") {
    return { category: "identifier", confidence: "medium" };
  }
  if (
    detector.startsWith("value.") &&
    (detector.includes("Token") ||
      detector.includes("Key") ||
      detector.includes("jwt") ||
      detector.includes("authorization") ||
      detector.includes("bearer") ||
      detector.includes("cookie") ||
      detector.includes("privateKey") ||
      detector.includes("github") ||
      detector.includes("aws") ||
      detector.includes("provider"))
  ) {
    return { category: "credential", confidence: "high" };
  }
  if (detector.startsWith("key.")) {
    return { category: "credential", confidence: "medium" };
  }
  return { category: "credential", confidence: "medium" };
}

function redactionOptionsFromPolicy(policy: CompiledRedactionPolicy | undefined): {
  extraKeys?: string[];
  detectors?: RedactionDetector[];
} {
  if (policy === undefined) return {};
  return {
    ...(policy.extraKeys.length > 0 ? { extraKeys: [...policy.extraKeys] } : {}),
    ...(policy.detectors.length > 0 ? { detectors: [...policy.detectors] } : {}),
  };
}

function redactionDetectorFindings(
  read: Awaited<ReturnType<typeof openTrace>>,
  runId: string | undefined,
  policy?: CompiledRedactionPolicy,
): TraceCheckFinding[] {
  const runs = runId === undefined
    ? read.runs
    : read.runs.filter((run) => run.runId === runId);
  const out: TraceCheckFinding[] = [];
  const policyOptions = redactionOptionsFromPolicy(policy);

  for (const run of runs) {
    for (const node of flattenNodes(run.children)) {
      const attrs = node.event.attributes;
      if (attrs === undefined) continue;

      const result = createRedactor({
        profile: "share",
        ...policyOptions,
      }).redact(attrs);
      for (const finding of result.findings) {
        if (finding.action === "keep") continue;
        const taxonomy = classifyRedactionDetector(finding.detector);
        out.push({
          ruleId: "safety.redactDetector",
          severity: detectorSeverity(finding),
          status: finding.severity === "error" ? "fail" : "warning",
          message: `Redaction detector ${finding.detector} matched ${finding.matchKind} at ${finding.path}.`,
          expected: "redacted trace content",
          actual: finding.detector,
          evidence: [
            {
              runId: node.event.runId,
              eventId: node.event.eventId,
              ...(node.event.parentId !== undefined ? { parentId: node.event.parentId } : {}),
              kind: node.event.kind,
              name: node.event.name,
              ...(node.event.status !== undefined ? { status: node.event.status } : {}),
              path: `attributes.${finding.path.replace(/^\$\.?/, "")}`,
            },
          ],
          category: taxonomy.category,
          confidence: taxonomy.confidence,
          detector: finding.detector,
          action: finding.action,
        });
      }
    }
  }

  return out.sort((a, b) => {
    const aEvidence = a.evidence[0];
    const bEvidence = b.evidence[0];
    return (
      (aEvidence?.runId ?? "").localeCompare(bEvidence?.runId ?? "") ||
      (aEvidence?.eventId ?? "").localeCompare(bEvidence?.eventId ?? "") ||
      (aEvidence?.path ?? "").localeCompare(bEvidence?.path ?? "") ||
      a.message.localeCompare(b.message)
    );
  });
}

function exitCodeFor(result: SafetyResult): number {
  if (result.status === "SAFE" || result.status === "SAFE WITH WARNINGS") return 0;
  if (result.status === "UNSAFE") return 1;
  return 2;
}

function toResidualStatus(status: SafetyStatus): ResidualSafetyStatus {
  if (status === "SAFE WITH WARNINGS") return "SAFE_WITH_WARNINGS";
  return status;
}

/** Map a full safety result into a residual assessment (no secret values). */
export function toResidualSafetyAssessment(result: {
  status: SafetyStatus;
  summary: SafetySummary;
  diagnostics: readonly SafetyDiagnostic[];
  findings: readonly TraceCheckFinding[];
}): ResidualSafetyAssessment {
  const codes = [
    ...new Set([
      ...result.diagnostics.map((item) => item.code),
      ...result.findings.map((item) => item.ruleId),
    ]),
  ].sort((a, b) => a.localeCompare(b));
  return {
    status: toResidualStatus(result.status),
    findings: result.summary.findings,
    warnings: result.summary.warnings,
    errors: result.summary.errors,
    codes,
    note: BEST_EFFORT_NOTE,
  };
}

/**
 * Assess residual safety on already-redacted content using the canonical
 * verify-safe detector pipeline. Supported AgentInspect traces get full
 * assessment; arbitrary JSON that cannot be opened as a trace yields UNKNOWN.
 */
export async function assessResidualFromContent(
  content: string,
  options: SafetyCommandOptions = {},
): Promise<ResidualSafetyAssessment> {
  try {
    const policy =
      options.compiledPolicy ??
      (options.policy !== undefined ? await loadRedactionPolicy(options.policy) : undefined);
    const read = await openTrace(
      { type: "string", content },
      { format: options.format ?? "agent-inspect-jsonl" },
    );
    const result = assessOpenedTrace(read, {
      ...options,
      ...(policy !== undefined ? { compiledPolicy: policy } : {}),
    });
    return toResidualSafetyAssessment(result);
  } catch (error) {
    if (error instanceof TraceReadError) {
      return toResidualSafetyAssessment(readErrorResult("verify-safe", error));
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "UNKNOWN",
      findings: 0,
      warnings: 0,
      errors: 1,
      codes: ["AI_SAFETY_TRACE_UNREADABLE"],
      note: `${BEST_EFFORT_NOTE} Residual assessment requires a supported AgentInspect trace; ${message}`,
    };
  }
}

function explainFinding(finding: TraceCheckFinding, blocksBundle: boolean): string[] {
  const path = finding.evidence[0]?.path ?? "(unknown path)";
  const category = finding.category ?? "structure";
  const confidence = finding.confidence ?? "medium";
  const detector = finding.detector ?? finding.ruleId;
  const action = finding.action ?? "review";
  const redactionHint =
    category === "credential" ||
    category === "personal-data" ||
    category === "raw-content" ||
    action.includes("redact")
      ? "Usually removable by share/strict redaction before bundling."
      : "May require omitting the field, lowering limits, or an explicit local override.";
  return [
    `  Matched: detector=${detector}; path=${path}; category=${category}`,
    `  Why: ${finding.message}`,
    `  Confidence: ${confidence}`,
    `  Redaction: ${redactionHint}`,
    `  Override: configure a custom redaction/detector rule locally (see docs/SAFETY-POLICY.md); do not weaken defaults globally.`,
    `  Bundle gate: ${blocksBundle ? "blocks share-safe bundle unless --allow-unsafe" : "does not block by itself (warning/info)"}`,
  ];
}

function findingExplanation(finding: TraceCheckFinding): Record<string, unknown> {
  const blocks = finding.severity === "error" || finding.status === "fail";
  return {
    ruleId: finding.ruleId,
    detector: finding.detector ?? finding.ruleId,
    path: finding.evidence[0]?.path,
    category: finding.category,
    confidence: finding.confidence,
    action: finding.action,
    blocksBundle: blocks,
    // Never include matched secret/PII values.
    message: finding.message,
  };
}

function printHuman(result: SafetyResult, explain = false): void {
  console.log(`Safety status: ${result.status}`);
  console.log(`Format: ${result.format}`);
  if (result.runId !== undefined) console.log(`Run: ${result.runId}`);
  if (result.sourceAssessment !== undefined && result.artifactAssessment !== undefined) {
    console.log(`Source assessment: ${result.sourceAssessment.status}`);
    console.log(`Artifact assessment: ${result.artifactAssessment.status}`);
    if (result.redactionSummary !== undefined) {
      console.log(
        `Redaction: profile=${result.redactionSummary.profile}, findings=${result.redactionSummary.findings}`,
      );
    }
  }
  console.log(
    `Summary: ${result.summary.findings} finding(s), ${result.summary.warnings} warning(s), ${result.summary.errors} error(s)`,
  );
  for (const diagnostic of result.diagnostics) {
    console.log(`- ${diagnostic.code}: ${diagnostic.message}`);
  }
  for (const finding of result.findings) {
    const path = finding.evidence[0]?.path;
    const taxonomy =
      finding.category !== undefined || finding.confidence !== undefined
        ? ` [${[finding.category, finding.confidence].filter(Boolean).join("/")}]`
        : "";
    console.log(`- ${finding.ruleId}: ${finding.message}${path ? ` (${path})` : ""}${taxonomy}`);
    if (explain) {
      const blocks = finding.severity === "error" || finding.status === "fail";
      for (const line of explainFinding(finding, blocks)) {
        console.log(line);
      }
    }
  }
  console.log(`Note: ${result.note}`);
}

function printJson(result: SafetyResult, explain = false): void {
  const payload =
    explain === true
      ? { ...result, explanations: result.findings.map(findingExplanation) }
      : result;
  console.log(JSON.stringify(stable(payload), null, 2));
}

async function safetyCommand(
  command: SafetyCommandName,
  target: string,
  options: SafetyCommandOptions,
  stdin: NodeJS.ReadableStream,
): Promise<void> {
  let result: SafetyResult;

  try {
    const policy =
      options.compiledPolicy ??
      (options.policy !== undefined ? await loadRedactionPolicy(options.policy) : undefined);
    const optionsWithPolicy: SafetyCommandOptions = {
      ...options,
      ...(policy !== undefined ? { compiledPolicy: policy } : {}),
    };
    const input = await inputFromTarget(target, optionsWithPolicy, stdin);
    const read = await openTrace(input, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
    const source = assessOpenedTrace(read, {
      ...optionsWithPolicy,
      ...(options.run !== undefined ? { runId: options.run } : {}),
    });
    if (command === "scan") {
      result = { ...source, command: "scan" };
    } else {
      const profile = options.redactionProfile ?? "share";
      const rawContent =
        input.type === "string"
          ? input.content
          : input.type === "file"
            ? await readFile(input.path, "utf-8")
            : undefined;

      if (rawContent === undefined) {
        // Directory / multi-run inputs: report source only until a single artifact exists.
        result = {
          ...source,
          command: "verify-safe",
          sourceAssessment: layerFromResult(source),
        };
      } else {
        const redacted = redactTraceContent(rawContent, profile, policy);
        // Reader labels (e.g. agent-inspect-v0.2-jsonl) are not registered format ids;
        // re-open redacted content with the canonical JSONL reader id.
        const artifactRead = await openTrace(
          { type: "string", content: redacted.content },
          { format: options.format ?? "agent-inspect-jsonl" },
        );
        const artifact = assessOpenedTrace(artifactRead, {
          ...optionsWithPolicy,
          ...(options.run !== undefined ? { runId: options.run } : {}),
        });
        const detectors = [
          ...new Set(redacted.findings.map((finding) => finding.detector)),
        ].sort((a, b) => a.localeCompare(b));
        result = resultFromParts({
          command: "verify-safe",
          format: artifact.format,
          runId: artifact.runId ?? source.runId,
          findings: artifact.findings,
          diagnostics: artifact.diagnostics,
          warnings: artifact.warnings,
          unsupportedFields: artifact.unsupportedFields,
          status: artifact.status,
          sourceAssessment: layerFromResult(source),
          artifactAssessment: layerFromResult(artifact),
          redactionSummary: {
            profile,
            findings: redacted.findings.length,
            detectors,
          },
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result = message.startsWith("--") || message.includes("--policy")
      ? invalidArgumentResult(command, error)
      : readErrorResult(command, error);
  }

  process.exitCode = exitCodeFor(result);
  if (options.json) printJson(result, options.explain === true);
  else printHuman(result, options.explain === true);
}

export function scanCommand(
  target: string,
  options: SafetyCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  return safetyCommand("scan", target, options, stdin);
}

export function verifySafeCommand(
  target: string,
  options: SafetyCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  return safetyCommand("verify-safe", target, options, stdin);
}

/** Assess safety on an already-opened trace (shared by bundle and safety commands). */
export function assessOpenedTrace(
  read: Awaited<ReturnType<typeof openTrace>>,
  options: SafetyCommandOptions & { runId?: string } = {},
): SafetyResult {
  try {
    const rules = buildSafetyRules(options);
    const checkResult = runTraceChecks(
      { read },
      {
        rules,
        ...(options.runId !== undefined ? { runId: options.runId } : {}),
        ...(options.run !== undefined ? { runId: options.run } : {}),
      },
    );
    const detectorFindings =
      checkResult.diagnostics.length === 0
        ? redactionDetectorFindings(read, checkResult.runId, options.compiledPolicy)
        : [];
    return resultFromParts({
      command: "verify-safe",
      format: checkResult.format,
      runId: checkResult.runId,
      findings: [...checkResult.findings, ...detectorFindings],
      diagnostics: [
        ...checkResult.diagnostics.map(diagnosticFromCheck),
        ...warningDiagnostics(read.warnings, read.unsupportedFields),
      ],
      warnings: read.warnings,
      unsupportedFields: read.unsupportedFields,
    });
  } catch (error) {
    return messageStartsWithDash(error)
      ? invalidArgumentResult("verify-safe", error)
      : readErrorResult("verify-safe", error);
  }
}

function messageStartsWithDash(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith("--");
}
