import type { TraceMetadataStatus } from "../types.js";

export type CohortMetricId =
  | "errorRate"
  | "duration"
  | "toolChoice"
  | "toolOrdering"
  | "llmCallCount"
  | "tokenUsage"
  | "retryCount"
  | "observationFailure"
  | "guardrailFailure"
  | "circuitViolation"
  | "redactionWarning";

export const COHORT_METRIC_IDS: readonly CohortMetricId[] = [
  "errorRate",
  "duration",
  "toolChoice",
  "toolOrdering",
  "llmCallCount",
  "tokenUsage",
  "retryCount",
  "observationFailure",
  "guardrailFailure",
  "circuitViolation",
  "redactionWarning",
];

export interface CohortRunMetrics {
  runId: string;
  cohortLabel?: string;
  groupKey: string;
  status: TraceMetadataStatus;
  error: boolean;
  durationMs?: number;
  llmCallCount: number;
  tokenUsageTotal?: number;
  retryCount: number;
  observationFailures: number;
  guardrailFailures: number;
  circuitViolations: number;
  redactionWarnings: number;
  toolChoices: string[];
  toolOrdering: string[];
}

export interface CohortAggregateMetrics {
  groupKey: string;
  cohortLabel?: string;
  runCount: number;
  errorRate: number;
  avgDurationMs?: number;
  p95DurationMs?: number;
  avgLlmCallCount: number;
  avgTokenUsage?: number;
  avgRetryCount: number;
  observationFailureRate: number;
  avgGuardrailFailures: number;
  avgCircuitViolations: number;
  avgRedactionWarnings: number;
  dominantToolChoice?: string;
  toolOrderingSignature?: string;
}

export interface CohortMetricComparison {
  metric: CohortMetricId;
  baseline?: number | string;
  candidate?: number | string;
  delta?: number | string;
  regression: boolean;
  message: string;
}

export interface CohortAnalysisResult {
  ok: boolean;
  traceDir: string;
  baseline?: string;
  candidate?: string;
  cohortKey: string;
  groupBy: string;
  metrics: CohortMetricId[];
  groups: CohortAggregateMetrics[];
  comparisons: CohortMetricComparison[];
  runs: CohortRunMetrics[];
  warnings: string[];
}

export interface CohortToleranceOptions {
  /** Minimum runs per cohort label before comparisons are considered valid. */
  minSampleSize?: number;
  /** Allowed relative delta (0–1) before a metric comparison is a regression. */
  maxRelativeDelta?: number;
}

export interface AnalyzeCohortOptions {
  traceDir: string;
  baseline?: string;
  candidate?: string;
  cohortKey?: string;
  groupBy?: string;
  metrics?: CohortMetricId[];
  tolerance?: CohortToleranceOptions;
}

export interface RenderCohortReportOptions {
  format?: "markdown" | "json" | "html";
}
