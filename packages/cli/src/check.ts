import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  TraceReadError,
  openTrace,
  type TraceReadResult,
} from "@agent-inspect/core/readers";
import {
  TraceDirectory,
  aggregateSessionCheckResults,
  filterMetasBySessionScope,
  loadSessionRunRecords,
  loadTraceMetadataList,
  parseDuration,
  resolveTraceDir,
} from "@agent-inspect/core/advanced";
import {
  createLlmUsageRule,
  createMaxStepDurationRule,
  createRequireCompletedRule,
  createRunDepthRule,
  createRunDurationRule,
  createObservedOutcomeRule,
  createRunStatusRule,
  createStallDetectionRule,
  createSafetyOversizedAttributeRule,
  createSafetyRawContentRule,
  createSafetyRedactionRule,
  createSafetySecretPatternRule,
  createStructureCycleRule,
  createStructureOrphanRule,
  createStructureParallelWidthRule,
  createStructureRelationshipRule,
  createToolUsageRule,
  runTraceChecks,
  type LlmUsageRuleOptions,
  type RunStatusRuleOptions,
  type SafetyOversizedAttributeRuleOptions,
  type StructureRelationshipRuleOptions,
  type ToolUsageRuleOptions,
  type TraceCheckDiagnostic,
  type TraceCheckDiagnosticCode,
  type TraceCheckResult,
  type TraceCheckRule,
} from "@agent-inspect/core/checks";

import {
  checkResultToEvidenceJson,
  parseEvidenceFormat,
  parseEvidenceProfile,
  resolveEvidenceOutputDir,
  shouldEmitEvidence,
  writeLocalEvidence,
  type EvidenceOnMode,
} from "./evidence-on.js";
import { inputFromTarget } from "./trace-input.js";
import { mergeSafetyExtensions } from "./safety-extensions.js";

export interface CheckCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  config?: string;
  json?: boolean;
  rule?: string[];
  maxDurationMs?: string;
  requiredTool?: string[];
  forbiddenTool?: string[];
  allowedModel?: string[];
  maxTotalTokens?: string;
  session?: string;
  group?: string;
  correlateGroup?: boolean;
  guardrails?: string[];
  circuit?: string[];
  maxStepDuration?: string;
  requireCompleted?: boolean;
  detectStalls?: boolean;
  failOnObservation?: string;
  /** Additive check preset: trajectory | safety | comprehensive. */
  preset?: string;
  /** Local Evidence v2 emit mode: fail | always | never. */
  evidenceOn?: EvidenceOnMode;
  evidenceDir?: string;
  evidenceProfile?: string;
  evidenceFormat?: string;
}

export const CHECK_PRESET_NAMES = ["trajectory", "safety", "comprehensive"] as const;
export type CheckPresetName = (typeof CHECK_PRESET_NAMES)[number];

export interface ResolvePresetContext {
  /** When true, trajectory/comprehensive select includes tool.usage. */
  hasToolRules?: boolean;
}

export interface ResolvedPreset {
  requireCompleted: boolean;
  enableSafetyRedaction: boolean;
  /** Inject structure.requireParentBeforeChild when config lacks relationship options. */
  enableStructureRelationshipDefaults: boolean;
  select: string[];
}

const DEFAULT_SELECT = ["run.status"];

/**
 * Preserve first-seen order while dropping empty and duplicate rule ids.
 */
export function uniqueSelectIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed === "" || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Rule ids implied by CLI shorthand flags on this invocation.
 * Does not include config-only constructed rules.
 */
export function cliShorthandSelectIds(options: CheckCommandOptions): string[] {
  const ids: string[] = [];
  if (options.failOnObservation !== undefined && options.failOnObservation.trim() !== "") {
    ids.push("outcome.status");
  }
  if ((options.requiredTool?.length ?? 0) > 0 || (options.forbiddenTool?.length ?? 0) > 0) {
    ids.push("tool.usage");
  }
  if ((options.allowedModel?.length ?? 0) > 0 || options.maxTotalTokens !== undefined) {
    ids.push("llm.usage");
  }
  if (options.maxDurationMs !== undefined) {
    ids.push("run.duration");
  }
  if (options.maxStepDuration !== undefined) {
    ids.push("run.maxStepDuration");
  }
  if (options.detectStalls === true) {
    ids.push("run.stall");
  }
  return ids;
}

/**
 * Canonical check select union:
 * 1. Preset base ids
 * 2. Explicit `--rule`
 * 3. Config `checks.select` (no silent expansion of unrelated configured rules)
 * 4. CLI shorthand ids used on this invocation
 * Empty explicit select (no preset / `--rule` / config select) keeps auto-select
 * of constructed rules plus default `run.status`.
 */
export function unionCheckSelect(input: {
  presetSelect?: readonly string[];
  explicitRules?: readonly string[];
  configSelect?: readonly string[];
  shorthandIds?: readonly string[];
  constructedRuleIds?: readonly string[];
}): string[] {
  const explicit = uniqueSelectIds([
    ...(input.presetSelect ?? []),
    ...(input.explicitRules ?? []),
    ...(input.configSelect ?? []),
  ]);
  if (explicit.length === 0) {
    return uniqueSelectIds([
      ...DEFAULT_SELECT,
      ...(input.constructedRuleIds ?? []).filter((id) => id !== "run.status"),
    ]);
  }
  const constructed = new Set(input.constructedRuleIds ?? []);
  const shorthand = (input.shorthandIds ?? []).filter(
    (id) => constructed.size === 0 || constructed.has(id),
  );
  return uniqueSelectIds([...explicit, ...shorthand]);
}

/**
 * Resolve an additive check preset into option/select patches.
 * Omitting preset returns undefined and leaves default check behavior unchanged.
 */
export function resolvePreset(
  preset: string | undefined,
  context: ResolvePresetContext = {},
): ResolvedPreset | undefined {
  if (preset === undefined || preset.trim() === "") return undefined;
  const name = preset.trim().toLowerCase();
  if (name !== "trajectory" && name !== "safety" && name !== "comprehensive") {
    throw new Error(
      `Unknown --preset "${preset}". Use trajectory, safety, or comprehensive.`,
    );
  }

  const trajectorySelect = [
    "run.status",
    "run.requireCompleted",
    "structure.orphan",
    "structure.cycle",
    "structure.relationship",
  ];
  if (context.hasToolRules === true) {
    trajectorySelect.push("tool.usage");
  }

  // Rule id for createSafetyRawContentRule is safety.rawPrompt.
  const safetySelect = [
    "run.status",
    "safety.rawPrompt",
    "safety.secretPattern",
    "safety.redaction",
  ];

  if (name === "trajectory") {
    return {
      requireCompleted: true,
      enableSafetyRedaction: false,
      enableStructureRelationshipDefaults: true,
      select: trajectorySelect,
    };
  }
  if (name === "safety") {
    return {
      requireCompleted: false,
      enableSafetyRedaction: true,
      enableStructureRelationshipDefaults: false,
      select: safetySelect,
    };
  }

  const select = [...new Set([...trajectorySelect, ...safetySelect])];
  return {
    requireCompleted: true,
    enableSafetyRedaction: true,
    enableStructureRelationshipDefaults: true,
    select,
  };
}

type CheckConfig = {
  checks?: {
    select?: string[];
    run?: RunStatusRuleOptions & {
      maxDurationMs?: number;
      maxDepth?: number;
    };
    tool?: ToolUsageRuleOptions;
    llm?: LlmUsageRuleOptions;
    structure?: StructureRelationshipRuleOptions & {
      orphan?: boolean;
      cycle?: boolean;
      maxChildren?: number;
      maxConcurrent?: number;
    };
    safety?: SafetyOversizedAttributeRuleOptions & {
      redaction?: boolean;
      rawContent?: boolean;
      secretPattern?: boolean;
    };
  };
};

type RuleBuildResult = {
  rules: TraceCheckRule[];
  select: string[];
  diagnostics: TraceCheckDiagnostic[];
};

const CONFIG_EXTENSIONS = new Set([".json", ".js", ".mjs", ".cjs"]);
const TS_CONFIG_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);

function diagnostic(
  code: TraceCheckDiagnosticCode,
  message: string,
  severity: TraceCheckDiagnostic["severity"] = "error",
): TraceCheckDiagnostic {
  return { code, message, severity };
}

function errorResult(
  code: TraceCheckDiagnosticCode,
  message: string,
  format = "unknown",
): TraceCheckResult {
  const diagnostics = [diagnostic(code, message)];
  return {
    ok: false,
    status: "error",
    format,
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: 1,
    },
    findings: [],
    diagnostics,
  };
}

function parseNumber(value: string | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return parsed;
}

function asStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Expected an array of strings.");
  }
  return value;
}

function asConfig(value: unknown): CheckConfig {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Config must export an object.");
  }
  return value as CheckConfig;
}

async function loadConfig(configPath: string | undefined): Promise<CheckConfig> {
  if (configPath === undefined) return {};
  const extension = path.extname(configPath);
  if (TS_CONFIG_EXTENSIONS.has(extension)) {
    throw new Error(
      "TypeScript check configs require an explicit precompiled JavaScript config or future --config-loader support.",
    );
  }
  if (!CONFIG_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported check config extension. Use .json, .js, .mjs, or .cjs.");
  }

  const absolute = path.resolve(configPath);
  if (extension === ".json") {
    const raw = await readFile(absolute, "utf-8");
    return asConfig(JSON.parse(raw));
  }

  const mod = await import(pathToFileURL(absolute).href);
  return asConfig("default" in mod ? mod.default : mod);
}

function normalizeConfig(config: CheckConfig): NonNullable<CheckConfig["checks"]> {
  if (config.checks === undefined) return {};
  if (typeof config.checks !== "object" || Array.isArray(config.checks)) {
    throw new Error("checks config must be an object.");
  }
  return config.checks;
}

function hasToolRulesConfigured(
  config: CheckConfig,
  options: CheckCommandOptions,
): boolean {
  const tool = normalizeConfig(config).tool ?? {};
  return Boolean(
    (tool.required?.length ?? 0) > 0 ||
      (tool.forbidden?.length ?? 0) > 0 ||
      (tool.allowed?.length ?? 0) > 0 ||
      tool.minCount !== undefined ||
      tool.maxCount !== undefined ||
      (options.requiredTool?.length ?? 0) > 0 ||
      (options.forbiddenTool?.length ?? 0) > 0,
  );
}

function applyResolvedPreset(
  config: CheckConfig,
  options: CheckCommandOptions,
  resolved: ResolvedPreset,
): { config: CheckConfig; options: CheckCommandOptions } {
  const checks = { ...normalizeConfig(config) };

  if (resolved.enableSafetyRedaction) {
    checks.safety = { ...checks.safety, redaction: true };
  }

  if (resolved.enableStructureRelationshipDefaults) {
    const structure = checks.structure ?? {};
    const needed =
      structure.minConfidence === undefined &&
      structure.requireParentBeforeChild === undefined &&
      structure.requireTraceParentSpan === undefined;
    if (needed) {
      checks.structure = { ...structure, requireParentBeforeChild: true };
    }
  }

  return {
    config: { checks },
    options: {
      ...options,
      ...(resolved.requireCompleted ? { requireCompleted: true } : {}),
    },
  };
}

function buildRules(
  config: CheckConfig,
  options: CheckCommandOptions,
  presetSelect: readonly string[] = [],
): RuleBuildResult {
  const diagnostics: TraceCheckDiagnostic[] = [];
  const checks = normalizeConfig(config);
  const run = checks.run ?? {};
  const tool = checks.tool ?? {};
  const llm = checks.llm ?? {};
  const structure = checks.structure ?? {};
  const safety = checks.safety ?? {};
  const maxDurationMs =
    parseNumber(options.maxDurationMs, "--max-duration-ms") ?? run.maxDurationMs;
  const maxTotalTokens =
    parseNumber(options.maxTotalTokens, "--max-total-tokens") ?? llm.maxTotalTokens;
  let maxStepDurationMs: number | undefined;
  if (options.maxStepDuration !== undefined) {
    try {
      maxStepDurationMs = parseDuration(options.maxStepDuration.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(
        diagnostic("AI_CHECK_INVALID_ARGUMENTS", `--max-step-duration: ${message}`),
      );
    }
  }
  const rules: TraceCheckRule[] = [
    createRunStatusRule(run),
    createStructureOrphanRule(),
    createStructureCycleRule(),
    createSafetyRawContentRule(),
    createSafetySecretPatternRule(),
  ];

  if (maxDurationMs !== undefined) {
    rules.push(createRunDurationRule({ maxDurationMs }));
  }
  if (maxStepDurationMs !== undefined) {
    rules.push(createMaxStepDurationRule({ maxDurationMs: maxStepDurationMs }));
  }
  if (options.requireCompleted) {
    rules.push(createRequireCompletedRule());
  }
  if (options.detectStalls) {
    rules.push(createStallDetectionRule({ requireEndedAt: true }));
  }
  if (options.failOnObservation !== undefined && options.failOnObservation.trim() !== "") {
    try {
      const statuses = options.failOnObservation
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value !== "")
        .map((value) => {
          if (
            value === "passed" ||
            value === "failed" ||
            value === "unknown" ||
            value === "skipped"
          ) {
            return value as "passed" | "failed" | "unknown" | "skipped";
          }
          throw new Error(`unsupported status "${value}"`);
        });
      rules.push(createObservedOutcomeRule({ failOn: statuses }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(
        diagnostic("AI_CHECK_INVALID_ARGUMENTS", `--fail-on-observation: ${message}`),
      );
    }
  }
  if (run.maxDepth !== undefined) {
    rules.push(createRunDepthRule({ maxDepth: run.maxDepth }));
  }

  const toolOptions: ToolUsageRuleOptions = {
    ...tool,
    required: [...(tool.required ?? []), ...(options.requiredTool ?? [])],
    forbidden: [...(tool.forbidden ?? []), ...(options.forbiddenTool ?? [])],
  };
  if (
    toolOptions.required?.length ||
    toolOptions.forbidden?.length ||
    toolOptions.allowed?.length ||
    toolOptions.minCount !== undefined ||
    toolOptions.maxCount !== undefined
  ) {
    rules.push(createToolUsageRule(toolOptions));
  }

  const llmOptions: LlmUsageRuleOptions = {
    ...llm,
    allowedModels: [...(llm.allowedModels ?? []), ...(options.allowedModel ?? [])],
    ...(maxTotalTokens !== undefined ? { maxTotalTokens } : {}),
  };
  if (
    llmOptions.allowedModels?.length ||
    llmOptions.allowedProviders?.length ||
    llmOptions.finishReasons?.length ||
    llmOptions.maxCalls !== undefined ||
    llmOptions.maxInputTokens !== undefined ||
    llmOptions.maxOutputTokens !== undefined ||
    llmOptions.maxTotalTokens !== undefined ||
    llmOptions.maxCachedTokens !== undefined
  ) {
    rules.push(createLlmUsageRule(llmOptions));
  }

  if (
    structure.minConfidence !== undefined ||
    structure.requireParentBeforeChild !== undefined ||
    structure.requireTraceParentSpan !== undefined
  ) {
    rules.push(createStructureRelationshipRule(structure));
  }
  if (structure.maxChildren !== undefined || structure.maxConcurrent !== undefined) {
    rules.push(
      createStructureParallelWidthRule({
        maxChildren: structure.maxChildren,
        maxConcurrent: structure.maxConcurrent,
      }),
    );
  }
  if (safety.redaction) rules.push(createSafetyRedactionRule());
  if (safety.maxStringLength !== undefined || safety.maxArrayLength !== undefined || safety.maxObjectKeys !== undefined || safety.maxSerializedBytes !== undefined) {
    rules.push(createSafetyOversizedAttributeRule(safety));
  }

  const constructedRuleIds = rules.map((rule) => rule.id);
  const shorthandIds = cliShorthandSelectIds(options);
  const select = unionCheckSelect({
    presetSelect,
    explicitRules: options.rule ?? [],
    configSelect: asStringArray(checks.select) ?? [],
    shorthandIds,
    constructedRuleIds,
  });

  return {
    rules,
    select,
    diagnostics,
  };
}

function exitCodeFor(result: TraceCheckResult): number {
  if (result.status === "pass") return 0;
  if (result.status === "fail") return 1;
  const codes = result.diagnostics.map((item) => item.code);
  if (
    codes.some((code) =>
      code === "AI_CHECK_UNSUPPORTED_FORMAT" ||
      code === "AI_CHECK_AMBIGUOUS_FORMAT"
    )
  ) {
    return 4;
  }
  if (
    codes.some((code) =>
      code === "AI_CHECK_TRACE_UNREADABLE" ||
      code === "AI_CHECK_BASELINE_UNREADABLE"
    )
  ) {
    return 3;
  }
  if (
    codes.some((code) =>
      code === "AI_CHECK_INVALID_ARGUMENTS" ||
      code === "AI_CHECK_INVALID_CONFIG" ||
      code === "AI_CHECK_CONFIG_LOAD_FAILED" ||
      code === "AI_CHECK_RUN_SELECTION_REQUIRED"
    )
  ) {
    return 2;
  }
  return 1;
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

function printJson(result: TraceCheckResult): void {
  console.log(JSON.stringify(stable(result), null, 2));
}

function isSafetyFinding(ruleId: string): boolean {
  return (
    ruleId.startsWith("safety.") ||
    ruleId.startsWith("guardrail.") ||
    ruleId.includes("pii") ||
    ruleId.includes("secret")
  );
}

function printPresetClassSummary(
  result: TraceCheckResult,
  preset: string | undefined,
): void {
  const name = preset?.trim().toLowerCase();
  if (name !== "trajectory" && name !== "safety" && name !== "comprehensive") {
    return;
  }
  const hasSafetyFindings = result.findings.some((finding) =>
    isSafetyFinding(finding.ruleId),
  );
  const hasTrajectoryFindings = result.findings.some(
    (finding) => !isSafetyFinding(finding.ruleId),
  );

  if (name === "trajectory") {
    console.log(
      `Trajectory: ${result.status === "pass" && !hasTrajectoryFindings ? "PASS" : result.status === "pass" ? "PASS" : "FAIL"}`,
    );
    console.log("Share safety: not evaluated");
    console.log("Run verify-safe before sharing.");
    return;
  }
  if (name === "safety") {
    console.log(
      `Share safety: ${result.status === "pass" && !hasSafetyFindings ? "PASS" : result.status === "pass" ? "PASS" : "FAIL"}`,
    );
    return;
  }
  console.log(
    `Trajectory: ${hasTrajectoryFindings || result.status === "error" ? "FAIL" : "PASS"}`,
  );
  console.log(
    `Share safety: ${hasSafetyFindings || result.status === "fail" ? "FAIL" : result.status === "pass" ? "PASS" : "FAIL"}`,
  );
}

function printHuman(
  result: TraceCheckResult,
  options: CheckCommandOptions = {},
): void {
  const scoped = result as {
    scopeKind?: string;
    scopeLabel?: string;
    runIds?: string[];
    runResults?: Array<{ runId: string; status: string }>;
  };
  if (scoped.scopeLabel) {
    console.log(`Scope: ${scoped.scopeKind} ${scoped.scopeLabel}`);
    if (scoped.runIds?.length) {
      console.log(`Runs: ${scoped.runIds.join(", ")}`);
    }
  }
  console.log(`Check status: ${result.status}`);
  printPresetClassSummary(result, options.preset);
  console.log(`Format: ${result.format}`);
  if (result.runId !== undefined) console.log(`Run: ${result.runId}`);
  console.log(
    `Summary: ${result.summary.failed} failed, ${result.summary.warnings} warning(s), ${result.summary.errors} error(s)`,
  );
  for (const diagnostic of result.diagnostics) {
    console.log(`- ${diagnostic.code}: ${diagnostic.message}`);
  }
  for (const finding of result.findings) {
    const path = finding.evidence[0]?.path;
    const run = finding.evidence[0]?.runId;
    const runPrefix = run ? `[${run}] ` : "";
    console.log(`- ${runPrefix}${finding.ruleId}: ${finding.message}${path ? ` (${path})` : ""}`);
  }
}

function readErrorResult(error: unknown): TraceCheckResult {
  if (error instanceof TraceReadError) {
    const code =
      error.code === "unsupported_format"
        ? "AI_CHECK_UNSUPPORTED_FORMAT"
        : error.code === "ambiguous_format"
          ? "AI_CHECK_AMBIGUOUS_FORMAT"
          : "AI_CHECK_TRACE_UNREADABLE";
    return errorResult(code, error.message);
  }
  return errorResult(
    "AI_CHECK_TRACE_UNREADABLE",
    error instanceof Error ? error.message : String(error),
  );
}

export async function checkCommand(
  target: string,
  options: CheckCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  let result: TraceCheckResult;
  let phase: "config" | "read" = "config";
  let evidenceRead: TraceReadResult | undefined;
  let evidenceRunIds: string[] = [];
  let evidenceSourceContents: Map<string, string> | undefined;

  const sessionId = options.session?.trim();
  const groupId = options.group?.trim();
  const useSessionScope = Boolean(sessionId || groupId);

  try {
    let config = await loadConfig(options.config);
    let effectiveOptions = options;
    const resolved = resolvePreset(options.preset, {
      hasToolRules: hasToolRulesConfigured(config, options),
    });
    if (resolved !== undefined) {
      const applied = applyResolvedPreset(config, options, resolved);
      config = applied.config;
      effectiveOptions = applied.options;
    }
    const built = buildRules(config, effectiveOptions, resolved?.select ?? []);
    if (built.diagnostics.some((item) => item.severity === "error")) {
      result = errorResult("AI_CHECK_INVALID_CONFIG", "Invalid check configuration.");
      result.diagnostics = [...built.diagnostics];
    } else if (useSessionScope) {
      phase = "read";
      const traceDir = resolveTraceDir({ dir: options.dir });
      const td = new TraceDirectory({ dir: traceDir });
      const files = await td.list();
      const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
        td.getPath(fileName),
      );
      const records = await loadSessionRunRecords(metas);
      const scoped = filterMetasBySessionScope(metas, records, {
        ...(sessionId ? { sessionId } : {}),
        ...(groupId ? { groupId } : {}),
        correlateByGroupId: options.correlateGroup === true,
      });
      const perRun: TraceCheckResult[] = [];
      const sourceContents = new Map<string, string>();
      for (const meta of scoped.metas) {
        const read = await openTrace(
          { type: "file", path: meta.filePath },
          {
            ...(options.format !== undefined ? { format: options.format } : {}),
          },
        );
        try {
          sourceContents.set(meta.runId, await readFile(meta.filePath, "utf-8"));
        } catch {
          sourceContents.set(
            meta.runId,
            `${read.events.map((event) => JSON.stringify(event)).join("\n")}\n`,
          );
        }
        perRun.push(
          mergeSafetyExtensions(
            runTraceChecks(
              { read },
              {
                rules: built.rules,
                select: built.select,
                runId: meta.runId,
              },
            ),
            read,
            {
              ...(options.guardrails ? { guardrails: options.guardrails } : {}),
              ...(options.circuit ? { circuits: options.circuit } : {}),
            },
          ),
        );
      }
      evidenceRunIds = scoped.runIds;
      evidenceSourceContents = sourceContents;
      result = aggregateSessionCheckResults(perRun, {
        scopeKind: scoped.scopeKind,
        scopeLabel: scoped.scopeLabel,
        runIds: scoped.runIds,
        sessionWarnings: scoped.warnings,
        notFound: scoped.notFound,
        empty: scoped.metas.length === 0,
      });
    } else {
      phase = "read";
      const input = await inputFromTarget(target, options, stdin);
      const read = await openTrace(input, {
        ...(options.format !== undefined ? { format: options.format } : {}),
      });
      evidenceRead = read;
      evidenceRunIds =
        options.run !== undefined
          ? [options.run]
          : read.runs.length === 1
            ? [read.runs[0]!.runId]
            : read.runs.map((run) => run.runId);
      if (input.type === "file") {
        try {
          const raw = await readFile(input.path, "utf-8");
          evidenceSourceContents = new Map(
            evidenceRunIds.map((runId) => [runId, raw]),
          );
        } catch {
          evidenceSourceContents = undefined;
        }
      } else {
        evidenceSourceContents = new Map(
          evidenceRunIds.map((runId) => [
            runId,
            `${read.events
              .filter((event) => event.runId === runId)
              .map((event) => JSON.stringify(event))
              .join("\n")}\n`,
          ]),
        );
      }
      result = mergeSafetyExtensions(
        runTraceChecks(
          { read },
          {
            rules: built.rules,
            select: built.select,
            ...(options.run !== undefined ? { runId: options.run } : {}),
          },
        ),
        read,
        {
          ...(options.guardrails ? { guardrails: options.guardrails } : {}),
          ...(options.circuit ? { circuits: options.circuit } : {}),
        },
      );
    }
  } catch (error) {
    if (phase === "config") {
      const message = error instanceof Error ? error.message : String(error);
      const code: TraceCheckDiagnosticCode =
        message.startsWith("--") || message.includes("Unknown --preset")
          ? "AI_CHECK_INVALID_ARGUMENTS"
          : error instanceof SyntaxError ||
              message.includes("Unsupported check config extension") ||
              message.includes("TypeScript check configs") ||
              message.includes("Config must") ||
              message.includes("checks config") ||
              message.includes("Expected an array")
            ? "AI_CHECK_INVALID_CONFIG"
            : "AI_CHECK_CONFIG_LOAD_FAILED";
      result = errorResult(
        code,
        message,
      );
    } else {
      result = readErrorResult(error);
    }
  }

  process.exitCode = exitCodeFor(result);

  const failed = result.status !== "pass";
  if (shouldEmitEvidence(options.evidenceOn, failed)) {
    try {
      const runIds =
        evidenceRunIds.length > 0
          ? evidenceRunIds
          : result.runId !== undefined
            ? [result.runId]
            : ["check"];
      if (
        evidenceSourceContents === undefined &&
        evidenceRead !== undefined
      ) {
        evidenceSourceContents = new Map(
          runIds.map((runId) => [
            runId,
            `${evidenceRead!.events
              .filter((event) => event.runId === runId)
              .map((event) => JSON.stringify(event))
              .join("\n")}\n`,
          ]),
        );
      }
      let redactionProfile = parseEvidenceProfile(options.evidenceProfile);
      let evidenceFormat = parseEvidenceFormat(options.evidenceFormat);
      const outputDir = resolveEvidenceOutputDir(
        options.evidenceDir,
        runIds[0] ?? "check",
      );
      const written = await writeLocalEvidence({
        outputDir,
        runIds,
        ...(evidenceSourceContents !== undefined
          ? { sourceContents: evidenceSourceContents }
          : {}),
        ...(options.dir !== undefined ? { dir: options.dir } : {}),
        failed,
        checkResultsJson: checkResultToEvidenceJson(result, runIds),
        summaryText: `Check status: ${result.status}`,
        redactionProfile,
        format: evidenceFormat,
      });
      if (!options.json) {
        console.log(`Evidence: ${written}`);
      }
    } catch (error) {
      console.error(
        `[AgentInspect] evidence package skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (options.json) printJson(result);
  else printHuman(result, options);
}
