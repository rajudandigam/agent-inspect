import type { SuiteRunResult } from "../suite/types.js";

export type GateExitCode = 0 | 1 | 2 | 3 | 4;

export type GateCheckId =
  | "suite"
  | "maxErrorRate"
  | "maxP95Duration"
  | "forbidTool"
  | "requireObservation";

export interface GateCheckResult {
  id: GateCheckId;
  name: string;
  ok: boolean;
  message: string;
  expected?: string | number;
  actual?: string | number;
  runId?: string;
}

export interface GateResult {
  ok: boolean;
  exitCode: GateExitCode;
  traceDir?: string;
  suitePath?: string;
  runCount: number;
  checks: GateCheckResult[];
  diagnostics: string[];
  suiteResult?: SuiteRunResult;
}

export interface RunGateOptions {
  traceDir?: string;
  suitePath?: string;
  cwd?: string;
  maxErrorRate?: number;
  maxP95DurationMs?: number;
  forbidTools?: string[];
  requireObservations?: string[];
}

export interface RenderGateReportOptions {
  format?: "markdown" | "json" | "html" | "junit" | "github";
}
