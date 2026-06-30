import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  TraceReadError,
  openTrace,
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

const DEFAULT_SELECT = ["run.status"];
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

function buildRules(
  config: CheckConfig,
  options: CheckCommandOptions,
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

  const select = [
    ...(asStringArray(checks.select) ?? []),
    ...(options.rule ?? []),
  ];

  return {
    rules,
    select: select.length > 0 ? select : DEFAULT_SELECT,
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

function printHuman(result: TraceCheckResult): void {
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

  const sessionId = options.session?.trim();
  const groupId = options.group?.trim();
  const useSessionScope = Boolean(sessionId || groupId);

  try {
    const config = await loadConfig(options.config);
    const built = buildRules(config, options);
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
      for (const meta of scoped.metas) {
        const read = await openTrace(
          { type: "file", path: meta.filePath },
          {
            ...(options.format !== undefined ? { format: options.format } : {}),
          },
        );
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
        message.startsWith("--")
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
  if (options.json) printJson(result);
  else printHuman(result);
}
