export type ObservedOutcomeStatus = "passed" | "failed" | "unknown" | "skipped";

export type ObservedOutcomeMethod =
  | "dom"
  | "accessibility"
  | "snapshot"
  | "network"
  | "storage"
  | "filesystem"
  | "database"
  | "queue"
  | "custom";

export interface ObservedOutcome {
  outcomeId: string;
  runId: string;
  parentId?: string;
  name: string;
  expectation: string;
  status: ObservedOutcomeStatus;
  method?: ObservedOutcomeMethod;
  actual?: unknown;
  evidence?: unknown;
  observedAt: number;
}

export interface ObserveOutcomeOptions {
  expectation: string;
  status: ObservedOutcomeStatus;
  method?: ObservedOutcomeMethod;
  actual?: unknown;
  evidence?: unknown;
  observedAt?: number | string;
}

export interface ObservedOutcomeSummary {
  total: number;
  passed: number;
  failed: number;
  unknown: number;
  skipped: number;
  outcomes: ObservedOutcome[];
}

export const OBSERVED_OUTCOME_STATUSES: readonly ObservedOutcomeStatus[] = [
  "passed",
  "failed",
  "unknown",
  "skipped",
];

export const OBSERVED_OUTCOME_METHODS: readonly ObservedOutcomeMethod[] = [
  "dom",
  "accessibility",
  "snapshot",
  "network",
  "storage",
  "filesystem",
  "database",
  "queue",
  "custom",
];

export const OUTCOME_ATTRIBUTE_STATUS_KEY = "outcomeStatus";
export const OUTCOME_ATTRIBUTE_EXPECTATION_KEY = "expectation";
export const OUTCOME_ATTRIBUTE_METHOD_KEY = "method";
export const OUTCOME_ATTRIBUTE_OBSERVED_AT_KEY = "observedAt";
export const OUTCOME_LEGACY_EVENT = "outcome_observed";
