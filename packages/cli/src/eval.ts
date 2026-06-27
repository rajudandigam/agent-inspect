import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  checks,
  evalRun,
  renderEvalMarkdown,
  type AnswerLengthBoundsOptions,
  type CitationPresenceOptions,
  type ContextOverlapOptions,
  type EvalDiagnostic,
  type EvalDiagnosticCode,
  type EvalRule,
  type QuoteOverlapOptions,
  type RequiredSourceIdsOptions,
  type EvalRunResult,
} from "@agent-inspect/eval";
import {
  TraceReadError,
  openTrace,
} from "@agent-inspect/core/readers";

import { inputFromTarget } from "./trace-input.js";

export interface EvalCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  config?: string;
  json?: boolean;
  markdown?: boolean;
  requireSuccess?: boolean;
  requiredTool?: string[];
  forbidTool?: string[];
  forbiddenTool?: string[];
  maxDurationMs?: string;
  maxDepth?: string;
  maxRetries?: string;
  maxTotalTokens?: string;
  requireRetrievalBeforeGeneration?: boolean;
  requiredDecisionMetadata?: string[];
  contextOverlap?: boolean;
  minContextOverlap?: string;
  minSharedTerms?: string;
  quoteOverlap?: boolean;
  citationPresence?: boolean;
  requiredSourceId?: string[];
  minAnswerCharacters?: string;
  maxAnswerCharacters?: string;
  minAnswerWords?: string;
  maxAnswerWords?: string;
  bannedPhrase?: string[];
}

type EvalConfig = {
  eval?: {
    requireSuccess?: boolean;
    requiredTools?: string[];
    forbiddenTools?: string[];
    maxDurationMs?: number;
    maxDepth?: number;
    maxRetries?: number;
    maxTotalTokens?: number;
    requiredRetrievalBeforeGeneration?: boolean;
    requiredDecisionMetadata?: string[];
    contextOverlap?: boolean | ContextOverlapOptions;
    quoteOverlap?: boolean | QuoteOverlapOptions;
    citationPresence?: boolean | CitationPresenceOptions;
    requiredSourceIds?: string[] | { ids: string[] } & RequiredSourceIdsOptions;
    answerLengthBounds?: AnswerLengthBoundsOptions;
    bannedUnsupportedPhrases?: string[];
  };
};

const CONFIG_EXTENSIONS = new Set([".json", ".js", ".mjs", ".cjs"]);
const TS_CONFIG_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);

function diagnostic(
  code: EvalDiagnosticCode,
  message: string,
  severity: EvalDiagnostic["severity"] = "error",
): EvalDiagnostic {
  return { code, message, severity };
}

function errorResult(code: EvalDiagnosticCode, message: string, format = "unknown"): EvalRunResult {
  return {
    ok: false,
    status: "error",
    format,
    summary: { passed: 0, failed: 0, warnings: 0, errors: 1 },
    findings: [],
    diagnostics: [diagnostic(code, message)],
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

function asStringArray(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value;
}

function asConfig(value: unknown): EvalConfig {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Config must export an object.");
  }
  return value as EvalConfig;
}

async function loadConfig(configPath: string | undefined): Promise<EvalConfig> {
  if (configPath === undefined) return {};
  const extension = path.extname(configPath);
  if (TS_CONFIG_EXTENSIONS.has(extension)) {
    throw new Error(
      "TypeScript eval configs require an explicit precompiled JavaScript config or future --config-loader support.",
    );
  }
  if (!CONFIG_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported eval config extension. Use .json, .js, .mjs, or .cjs.");
  }

  const absolute = path.resolve(configPath);
  if (extension === ".json") {
    const raw = await readFile(absolute, "utf-8");
    return asConfig(JSON.parse(raw));
  }

  const mod = await import(pathToFileURL(absolute).href);
  return asConfig("default" in mod ? mod.default : mod);
}

function normalizeConfig(config: EvalConfig): NonNullable<EvalConfig["eval"]> {
  if (config.eval === undefined) return {};
  if (typeof config.eval !== "object" || Array.isArray(config.eval)) {
    throw new Error("eval config must be an object.");
  }
  return config.eval;
}

function maybeAdd<T>(rules: EvalRule[], value: T | undefined, makeRule: (value: T) => EvalRule): void {
  if (value !== undefined) rules.push(makeRule(value));
}

function optionObject<T extends object>(value: boolean | T | undefined): T | undefined {
  if (value === undefined || value === false) return undefined;
  if (value === true) return {} as T;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Eval heuristic config must be a boolean or object.");
  }
  return value;
}

function sourceIdsFromConfig(
  value: NonNullable<NonNullable<EvalConfig["eval"]>["requiredSourceIds"]> | undefined,
): { ids: string[]; options?: RequiredSourceIdsOptions } | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return { ids: asStringArray(value, "eval.requiredSourceIds") ?? [] };
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("eval.requiredSourceIds must be an array or object.");
  }
  const ids = asStringArray(value.ids, "eval.requiredSourceIds.ids") ?? [];
  return { ids, options: { sourceIdKeys: value.sourceIdKeys } };
}

function buildRules(config: EvalConfig, options: EvalCommandOptions): EvalRule[] | undefined {
  const evalConfig = normalizeConfig(config);
  const rules: EvalRule[] = [];

  if (evalConfig.requireSuccess || options.requireSuccess) rules.push(checks.requireSuccess());

  const requiredTools = [
    ...(asStringArray(evalConfig.requiredTools, "eval.requiredTools") ?? []),
    ...(options.requiredTool ?? []),
  ];
  if (requiredTools.length > 0) rules.push(checks.requiredTools(requiredTools));

  const forbiddenTools = [
    ...(asStringArray(evalConfig.forbiddenTools, "eval.forbiddenTools") ?? []),
    ...(options.forbidTool ?? []),
    ...(options.forbiddenTool ?? []),
  ];
  if (forbiddenTools.length > 0) rules.push(checks.forbiddenTools(forbiddenTools));

  const maxDurationMs =
    parseNumber(options.maxDurationMs, "--max-duration-ms") ?? evalConfig.maxDurationMs;
  maybeAdd(rules, maxDurationMs, checks.maxDurationMs);

  const maxDepth = parseNumber(options.maxDepth, "--max-depth") ?? evalConfig.maxDepth;
  maybeAdd(rules, maxDepth, checks.maxDepth);

  const maxRetries = parseNumber(options.maxRetries, "--max-retries") ?? evalConfig.maxRetries;
  maybeAdd(rules, maxRetries, checks.maxRetries);

  const maxTotalTokens =
    parseNumber(options.maxTotalTokens, "--max-total-tokens") ?? evalConfig.maxTotalTokens;
  maybeAdd(rules, maxTotalTokens, checks.maxTotalTokens);

  if (
    evalConfig.requiredRetrievalBeforeGeneration ||
    options.requireRetrievalBeforeGeneration
  ) {
    rules.push(checks.requiredRetrievalBeforeGeneration());
  }

  const requiredDecisionMetadata = [
    ...(asStringArray(
      evalConfig.requiredDecisionMetadata,
      "eval.requiredDecisionMetadata",
    ) ?? []),
    ...(options.requiredDecisionMetadata ?? []),
  ];
  if (requiredDecisionMetadata.length > 0) {
    rules.push(checks.requiredDecisionMetadata(requiredDecisionMetadata));
  }

  const contextOverlap = optionObject<ContextOverlapOptions>(evalConfig.contextOverlap);
  const minOverlap = parseNumber(options.minContextOverlap, "--min-context-overlap");
  const minSharedTerms = parseNumber(options.minSharedTerms, "--min-shared-terms");
  if (contextOverlap !== undefined || options.contextOverlap || minOverlap !== undefined || minSharedTerms !== undefined) {
    rules.push(checks.contextOverlap({ ...contextOverlap, minOverlap, minSharedTerms }));
  }

  const quoteOverlap = optionObject<QuoteOverlapOptions>(evalConfig.quoteOverlap);
  if (quoteOverlap !== undefined || options.quoteOverlap) {
    rules.push(checks.quoteOverlap(quoteOverlap));
  }

  const citationPresence = optionObject<CitationPresenceOptions>(evalConfig.citationPresence);
  if (citationPresence !== undefined || options.citationPresence) {
    rules.push(checks.citationPresence(citationPresence));
  }

  const sourceIds = sourceIdsFromConfig(evalConfig.requiredSourceIds);
  const requiredSourceIds = [...(sourceIds?.ids ?? []), ...(options.requiredSourceId ?? [])];
  if (requiredSourceIds.length > 0) {
    rules.push(checks.requiredSourceIds(requiredSourceIds, sourceIds?.options));
  }

  const cliAnswerLength: AnswerLengthBoundsOptions = {
    minCharacters: parseNumber(options.minAnswerCharacters, "--min-answer-characters"),
    maxCharacters: parseNumber(options.maxAnswerCharacters, "--max-answer-characters"),
    minWords: parseNumber(options.minAnswerWords, "--min-answer-words"),
    maxWords: parseNumber(options.maxAnswerWords, "--max-answer-words"),
  };
  const hasCliAnswerLength = Object.values(cliAnswerLength).some((value) => value !== undefined);
  if (evalConfig.answerLengthBounds !== undefined || hasCliAnswerLength) {
    rules.push(checks.answerLengthBounds({ ...evalConfig.answerLengthBounds, ...cliAnswerLength }));
  }

  const bannedPhrases = [
    ...(asStringArray(
      evalConfig.bannedUnsupportedPhrases,
      "eval.bannedUnsupportedPhrases",
    ) ?? []),
    ...(options.bannedPhrase ?? []),
  ];
  if (bannedPhrases.length > 0) rules.push(checks.bannedUnsupportedPhrases(bannedPhrases));

  return rules.length > 0 ? rules : undefined;
}

function exitCodeFor(result: EvalRunResult): number {
  if (result.status === "pass") return 0;
  if (result.status === "fail") return 1;
  return 2;
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

function printJson(result: EvalRunResult): void {
  console.log(JSON.stringify(stable(result), null, 2));
}

function printHuman(result: EvalRunResult): void {
  console.log(`Eval status: ${result.status}`);
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
    console.log(`- ${finding.ruleId}: ${finding.message}${path ? ` (${path})` : ""}`);
  }
}

function readErrorResult(error: unknown): EvalRunResult {
  if (error instanceof TraceReadError) {
    const code =
      error.code === "unsupported_format"
        ? "AI_EVAL_UNSUPPORTED_FORMAT"
        : error.code === "ambiguous_format"
          ? "AI_EVAL_AMBIGUOUS_FORMAT"
          : "AI_EVAL_TRACE_UNREADABLE";
    return errorResult(code, error.message);
  }
  return errorResult(
    "AI_EVAL_TRACE_UNREADABLE",
    error instanceof Error ? error.message : String(error),
  );
}

export async function evalCommand(
  target: string,
  options: EvalCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  let result: EvalRunResult;
  let phase: "config" | "read" = "config";

  try {
    const config = await loadConfig(options.config);
    const rules = buildRules(config, options);
    phase = "read";
    const input = await inputFromTarget(target, options, stdin);
    const read = await openTrace(input, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
    result = await evalRun(read, {
      ...(rules !== undefined ? { checks: rules } : {}),
      ...(options.run !== undefined ? { runId: options.run } : {}),
    });
  } catch (error) {
    if (phase === "config") {
      const message = error instanceof Error ? error.message : String(error);
      const code: EvalDiagnosticCode =
        message.startsWith("--")
          ? "AI_EVAL_INVALID_ARGUMENTS"
          : error instanceof SyntaxError ||
              message.includes("Unsupported eval config extension") ||
              message.includes("TypeScript eval configs") ||
              message.includes("Config must") ||
              message.includes("eval config") ||
              message.includes("must be an array")
            ? "AI_EVAL_INVALID_CONFIG"
            : "AI_EVAL_CONFIG_LOAD_FAILED";
      result = errorResult(code, message);
    } else {
      result = readErrorResult(error);
    }
  }

  process.exitCode = exitCodeFor(result);
  if (options.json) printJson(result);
  else if (options.markdown) console.log(renderEvalMarkdown(result).trimEnd());
  else printHuman(result);
}
