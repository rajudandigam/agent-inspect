import { extractSessionWorkflowMetadata } from "./metadata.js";
import type {
  EnrichSessionSummaryOptions,
  SessionCheckSummary,
  SessionLastError,
  SessionRunRecord,
  SessionStatus,
  SessionSummary,
} from "./types.js";

const DEFAULT_STALE_THRESHOLD_MS = 86_400_000;

const EXPLICIT_STATUS_PRIORITY: Record<string, number> = {
  error: 5,
  waiting_input: 4,
  idle: 3,
  stale: 2,
  completed: 1,
};

const EXPLICIT_SESSION_STATUSES = new Set<string>([
  "running",
  "waiting_input",
  "idle",
  "completed",
  "error",
  "stale",
  "unknown",
]);

function isExplicitSessionStatus(value: unknown): value is SessionStatus {
  return typeof value === "string" && EXPLICIT_SESSION_STATUSES.has(value);
}

function activityMs(run: SessionRunRecord): number {
  return run.endedAt ?? run.startedAt ?? 0;
}

function latestActivityMs(runs: readonly SessionRunRecord[]): number {
  let latest = 0;
  for (const run of runs) {
    const ms = activityMs(run);
    if (ms > latest) latest = ms;
  }
  return latest;
}

function earliestStart(runs: readonly SessionRunRecord[]): number | undefined {
  let earliest: number | undefined;
  for (const run of runs) {
    if (run.startedAt === undefined) continue;
    if (earliest === undefined || run.startedAt < earliest) {
      earliest = run.startedAt;
    }
  }
  return earliest;
}

function latestEndWhenAllEnded(runs: readonly SessionRunRecord[]): number | undefined {
  if (runs.length === 0) return undefined;
  let latest: number | undefined;
  for (const run of runs) {
    if (run.endedAt === undefined) return undefined;
    if (latest === undefined || run.endedAt > latest) latest = run.endedAt;
  }
  return latest;
}

function pickExplicitStatus(runs: readonly SessionRunRecord[]): SessionStatus | undefined {
  let best: SessionStatus | undefined;
  let bestPriority = 0;
  for (const run of runs) {
    const raw = run.metadata?.sessionStatus;
    if (!isExplicitSessionStatus(raw)) continue;
    const priority = EXPLICIT_STATUS_PRIORITY[raw] ?? 0;
    if (priority > bestPriority) {
      bestPriority = priority;
      best = raw;
    }
  }
  return best;
}

function deriveLastError(runs: readonly SessionRunRecord[]): SessionLastError | undefined {
  const errorRuns = runs
    .filter((run) => run.status === "error")
    .sort((a, b) => activityMs(b) - activityMs(a));
  const latest = errorRuns[0];
  if (!latest) return undefined;

  const meta = latest.metadata ?? {};
  const message =
    typeof meta.errorMessage === "string" && meta.errorMessage.trim() !== ""
      ? meta.errorMessage.trim()
      : (latest.name ?? latest.runId);
  const code =
    typeof meta.errorCode === "string" && meta.errorCode.trim() !== ""
      ? meta.errorCode.trim()
      : undefined;

  return { runId: latest.runId, message, code };
}

function deriveCheckSummary(
  runs: readonly SessionRunRecord[],
): SessionCheckSummary | undefined {
  let pass = 0;
  let fail = 0;
  let warn = 0;
  let found = false;

  for (const run of runs) {
    const summary = run.metadata?.checkSummary;
    if (!summary || typeof summary !== "object") continue;
    const record = summary as Record<string, unknown>;
    if (typeof record.pass === "number") {
      pass += record.pass;
      found = true;
    }
    if (typeof record.fail === "number") {
      fail += record.fail;
      found = true;
    }
    if (typeof record.warn === "number") {
      warn += record.warn;
      found = true;
    }
  }

  return found ? { pass, fail, warn } : undefined;
}

function deriveObservationSummary(runs: readonly SessionRunRecord[]): string | undefined {
  for (const run of [...runs].sort((a, b) => activityMs(b) - activityMs(a))) {
    const value = run.metadata?.observationSummary;
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

/** Derives session status from run records per the v4.2 RFC (no timestamp-only causality). */
export function deriveSessionStatus(
  runs: readonly SessionRunRecord[],
  options: EnrichSessionSummaryOptions = {},
): SessionStatus {
  if (runs.length === 0) return "unknown";

  if (runs.some((run) => run.status === "running")) return "running";

  const explicit = pickExplicitStatus(runs);
  if (explicit && explicit !== "running") return explicit;

  if (runs.some((run) => run.status === "error")) return "error";

  if (runs.every((run) => run.status === "success")) return "completed";

  const nowMs = options.nowMs ?? Date.now();
  const staleThresholdMs = options.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS;
  const lastMs = latestActivityMs(runs);
  if (lastMs > 0 && nowMs - lastMs > staleThresholdMs) return "stale";

  return "unknown";
}

/**
 * Enriches a session summary with v4.2 derived fields (status, timing, errors).
 * Pure function; does not read trace files.
 */
export function enrichSessionSummary(
  summary: Omit<
    SessionSummary,
    | "status"
    | "lastActivity"
    | "retryCount"
    | "startedAt"
    | "endedAt"
    | "durationMs"
    | "correlationId"
    | "jobId"
    | "workflowId"
    | "lastError"
    | "observationSummary"
    | "checkSummary"
  >,
  runs: readonly SessionRunRecord[],
  options: EnrichSessionSummaryOptions = {},
): SessionSummary {
  const sessionRuns = runs
    .filter((run) => summary.runIds.includes(run.runId))
    .sort((a, b) => a.runId.localeCompare(b.runId));

  const startedAt = earliestStart(sessionRuns);
  const endedAt = latestEndWhenAllEnded(sessionRuns);
  const durationMs =
    startedAt !== undefined && endedAt !== undefined ? endedAt - startedAt : undefined;

  let correlationId: string | undefined;
  let jobId: string | undefined;
  let workflowId: string | undefined;
  for (const run of sessionRuns) {
    const meta = extractSessionWorkflowMetadata(run.metadata);
    if (!correlationId && meta?.correlationId) correlationId = meta.correlationId;
    if (!jobId && meta?.jobId) jobId = meta.jobId;
    if (!workflowId && meta?.workflowName) workflowId = meta.workflowName;
    else if (!workflowId && meta?.workflowStep) workflowId = meta.workflowStep;
  }

  const lastMs = latestActivityMs(sessionRuns);
  const lastActivity =
    lastMs > 0 ? new Date(lastMs).toISOString() : new Date(0).toISOString();

  const retryCount = summary.retries.filter(
    (retry) => retry.retryOf !== undefined || (retry.attempt ?? 0) > 1,
  ).length;

  return {
    ...summary,
    status: deriveSessionStatus(sessionRuns, options),
    startedAt,
    endedAt,
    durationMs,
    correlationId,
    jobId,
    workflowId,
    lastError: deriveLastError(sessionRuns),
    lastActivity,
    retryCount,
    observationSummary: deriveObservationSummary(sessionRuns),
    checkSummary: deriveCheckSummary(sessionRuns),
  };
}
