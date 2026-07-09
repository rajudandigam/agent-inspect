import { extractOutcomesFromTraceEvents } from "../outcomes/extract.js";
import { buildRunSummary } from "../trace-metadata.js";
import { readTraceEventsFromFile } from "../storage.js";
import type { StepStartedEvent, TraceEvent } from "../types.js";
import type { CohortRunMetrics } from "./types.js";

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toolSteps(events: readonly TraceEvent[]): { choices: string[]; ordering: string[] } {
  const ordering: string[] = [];
  const choices = new Set<string>();
  const sorted = [...events]
    .filter((event) => event.event === "step_started")
    .sort((a, b) => a.timestamp - b.timestamp);
  for (const event of sorted) {
    const step = event as StepStartedEvent;
    if (step.type !== "tool") continue;
    const name =
      typeof step.metadata?.toolName === "string"
        ? step.metadata.toolName
        : step.name;
    ordering.push(name);
    choices.add(name);
  }
  return { choices: [...choices].sort(), ordering };
}

export async function computeCohortRunMetrics(input: {
  runId: string;
  filePath: string;
  metadata?: Record<string, unknown>;
  status?: CohortRunMetrics["status"];
  durationMs?: number;
  groupKey: string;
  cohortLabel?: string;
}): Promise<CohortRunMetrics> {
  const events = await readTraceEventsFromFile(input.filePath);
  const summary = buildRunSummary(events);
  const tools = toolSteps(events);
  const outcomes = extractOutcomesFromTraceEvents(events);
  const observationFailures = outcomes.filter((item) => item.status === "failed").length;

  const metadata = input.metadata ?? {};
  const retryCount =
    asNumber(metadata.attempt) !== undefined && asNumber(metadata.attempt)! > 1
      ? asNumber(metadata.attempt)! - 1
      : typeof metadata.retryOf === "string"
        ? 1
        : 0;

  return {
    runId: input.runId,
    ...(input.cohortLabel !== undefined ? { cohortLabel: input.cohortLabel } : {}),
    groupKey: input.groupKey,
    status: summary.status,
    error: summary.status === "error",
    durationMs: summary.durationMs ?? input.durationMs,
    llmCallCount: summary.llmSteps,
    tokenUsageTotal: summary.totalTokens?.total,
    retryCount,
    observationFailures,
    guardrailFailures: asNumber(metadata.guardrailFailures) ?? 0,
    circuitViolations: asNumber(metadata.circuitViolations) ?? 0,
    redactionWarnings: asNumber(metadata.redactionWarnings) ?? 0,
    toolChoices: tools.choices,
    toolOrdering: tools.ordering,
  };
}

function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

function dominantToolChoice(runs: readonly CohortRunMetrics[]): string | undefined {
  const counts = new Map<string, number>();
  for (const run of runs) {
    const signature = run.toolChoices.join(",");
    if (signature === "") continue;
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function orderingSignature(runs: readonly CohortRunMetrics[]): string | undefined {
  const counts = new Map<string, number>();
  for (const run of runs) {
    const signature = run.toolOrdering.join(">");
    if (signature === "") continue;
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

export function aggregateCohortMetrics(
  runs: readonly CohortRunMetrics[],
  groupKey: string,
  cohortLabel?: string,
) {
  const durations = runs
    .map((run) => run.durationMs)
    .filter((value): value is number => typeof value === "number");
  const tokenValues = runs
    .map((run) => run.tokenUsageTotal)
    .filter((value): value is number => typeof value === "number");
  const errors = runs.filter((run) => run.error).length;
  const observationFailures = runs.reduce((sum, run) => sum + run.observationFailures, 0);

  return {
    groupKey,
    ...(cohortLabel !== undefined ? { cohortLabel } : {}),
    runCount: runs.length,
    errorRate: runs.length > 0 ? errors / runs.length : 0,
    avgDurationMs:
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : undefined,
    p95DurationMs: percentile(durations, 95),
    avgLlmCallCount:
      runs.length > 0
        ? runs.reduce((sum, run) => sum + run.llmCallCount, 0) / runs.length
        : 0,
    avgTokenUsage:
      tokenValues.length > 0
        ? tokenValues.reduce((sum, value) => sum + value, 0) / tokenValues.length
        : undefined,
    avgRetryCount:
      runs.length > 0
        ? runs.reduce((sum, run) => sum + run.retryCount, 0) / runs.length
        : 0,
    observationFailureRate:
      runs.length > 0 ? observationFailures / runs.length : 0,
    avgGuardrailFailures:
      runs.length > 0
        ? runs.reduce((sum, run) => sum + run.guardrailFailures, 0) / runs.length
        : 0,
    avgCircuitViolations:
      runs.length > 0
        ? runs.reduce((sum, run) => sum + run.circuitViolations, 0) / runs.length
        : 0,
    avgRedactionWarnings:
      runs.length > 0
        ? runs.reduce((sum, run) => sum + run.redactionWarnings, 0) / runs.length
        : 0,
    dominantToolChoice: dominantToolChoice(runs),
    toolOrderingSignature: orderingSignature(runs),
  };
}
