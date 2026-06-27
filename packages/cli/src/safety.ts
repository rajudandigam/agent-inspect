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
import { redact, type RedactionFinding } from "@agent-inspect/redact";

import { inputFromTarget } from "./trace-input.js";

export interface SafetyCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  json?: boolean;
  maxStringLength?: string;
  maxArrayLength?: string;
  maxObjectKeys?: string;
  maxSerializedBytes?: string;
}

type SafetyStatus = "SAFE" | "SAFE WITH WARNINGS" | "UNSAFE" | "UNKNOWN";
type SafetyCommandName = "scan" | "verify-safe";

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
}): SafetyResult {
  const findings = [...(parts.findings ?? [])];
  const diagnostics = [...(parts.diagnostics ?? [])];
  const warnings = [...(parts.warnings ?? [])];
  const unsupportedFields = [...(parts.unsupportedFields ?? [])];
  const status = statusFrom(findings, diagnostics);
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

function redactionDetectorFindings(
  read: Awaited<ReturnType<typeof openTrace>>,
  runId: string | undefined,
): TraceCheckFinding[] {
  const runs = runId === undefined
    ? read.runs
    : read.runs.filter((run) => run.runId === runId);
  const out: TraceCheckFinding[] = [];

  for (const run of runs) {
    for (const node of flattenNodes(run.children)) {
      const attrs = node.event.attributes;
      if (attrs === undefined) continue;

      const result = redact(attrs, { profile: "share" });
      for (const finding of result.findings) {
        if (finding.action === "keep") continue;
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

function printJson(result: SafetyResult): void {
  console.log(JSON.stringify(stable(result), null, 2));
}

function printHuman(result: SafetyResult): void {
  console.log(`Safety status: ${result.status}`);
  console.log(`Format: ${result.format}`);
  if (result.runId !== undefined) console.log(`Run: ${result.runId}`);
  console.log(
    `Summary: ${result.summary.findings} finding(s), ${result.summary.warnings} warning(s), ${result.summary.errors} error(s)`,
  );
  for (const diagnostic of result.diagnostics) {
    console.log(`- ${diagnostic.code}: ${diagnostic.message}`);
  }
  for (const finding of result.findings) {
    const path = finding.evidence[0]?.path;
    console.log(`- ${finding.ruleId}: ${finding.message}${path ? ` (${path})` : ""}`);
  }
  console.log(`Note: ${result.note}`);
}

async function safetyCommand(
  command: SafetyCommandName,
  target: string,
  options: SafetyCommandOptions,
  stdin: NodeJS.ReadableStream,
): Promise<void> {
  let result: SafetyResult;

  try {
    const rules = buildSafetyRules(options);
    const input = await inputFromTarget(target, options, stdin);
    const read = await openTrace(input, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
    const checkResult = runTraceChecks(
      { read },
      {
        rules,
        ...(options.run !== undefined ? { runId: options.run } : {}),
      },
    );
    const detectorFindings =
      checkResult.diagnostics.length === 0
        ? redactionDetectorFindings(read, checkResult.runId)
        : [];
    result = resultFromParts({
      command,
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
    const message = error instanceof Error ? error.message : String(error);
    result = message.startsWith("--")
      ? invalidArgumentResult(command, error)
      : readErrorResult(command, error);
  }

  process.exitCode = exitCodeFor(result);
  if (options.json) printJson(result);
  else printHuman(result);
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
