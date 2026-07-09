import type { RedactionProfile } from "../types.js";

export type SuiteCaseStatus = "pass" | "fail" | "error" | "skipped";

export type SuiteDiagnosticCode =
  | "AI_SUITE_CONFIG_INVALID"
  | "AI_SUITE_CONFIG_LOAD_FAILED"
  | "AI_SUITE_CASE_TRACE_MISSING"
  | "AI_SUITE_CASE_CHECK_FAILED"
  | "AI_SUITE_CASE_EVAL_FAILED"
  | "AI_SUITE_CASE_OBSERVATION_FAILED"
  | "AI_SUITE_TRACE_UNREADABLE";

export interface SuiteDiagnostic {
  code: SuiteDiagnosticCode;
  severity: "error" | "warning" | "info";
  message: string;
  caseId?: string;
}

export interface SuiteCaseConfig {
  id: string;
  trace?: string;
  runId?: string;
  input?: string;
  requireTools?: string[];
  forbidTools?: string[];
  maxDurationMs?: number;
  expectedObservations?: string[];
}

export interface SuiteChecksConfig {
  select?: string[];
  run?: {
    maxDurationMs?: number;
    maxDepth?: number;
  };
  tool?: {
    required?: string[];
    forbidden?: string[];
  };
  llm?: {
    allowedModels?: string[];
    maxTotalTokens?: number;
  };
}

export interface SuiteEvalConfig {
  requireSuccess?: boolean;
  requiredTools?: string[];
  forbiddenTools?: string[];
  maxDurationMs?: number;
  maxDepth?: number;
  maxRetries?: number;
  maxTotalTokens?: number;
}

export interface SuiteArtifactsConfig {
  outputDir?: string;
}

export interface SuiteConfig {
  name: string;
  traces: string;
  cases: SuiteCaseConfig[];
  checks?: SuiteChecksConfig;
  eval?: SuiteEvalConfig;
  redactionProfile?: RedactionProfile;
  artifacts?: SuiteArtifactsConfig;
  baseline?: string;
  candidate?: string;
}

export interface SuiteCaseResult {
  id: string;
  status: SuiteCaseStatus;
  tracePath?: string;
  runId?: string;
  checkOk?: boolean;
  evalOk?: boolean;
  observationsOk?: boolean;
  message?: string;
  diagnostics: SuiteDiagnostic[];
}

export interface SuiteRunSummary {
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
}

export interface SuiteRunResult {
  ok: boolean;
  status: "pass" | "fail" | "error";
  suiteName: string;
  configPath: string;
  tracesDir: string;
  startedAt: string;
  finishedAt: string;
  summary: SuiteRunSummary;
  cases: SuiteCaseResult[];
  diagnostics: SuiteDiagnostic[];
}

export interface LoadSuiteConfigOptions {
  configPath?: string;
  cwd?: string;
}

export interface ValidateSuiteConfigResult {
  ok: boolean;
  diagnostics: SuiteDiagnostic[];
}

export interface RunSuiteOptions {
  configPath?: string;
  cwd?: string;
  nowMs?: number;
}

export interface RenderSuiteReportOptions {
  format?: "markdown" | "json";
}

export const DEFAULT_SUITE_CONFIG_NAMES = [
  "agent-inspect.suite.json",
  "agent-inspect.suite.js",
  "agent-inspect.suite.mjs",
  "agent-inspect.suite.cjs",
] as const;

export const DEFAULT_SUITE_ARTIFACTS_DIR = ".agent-inspect/suite-runs";
