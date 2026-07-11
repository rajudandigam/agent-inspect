import type {
  CohortAggregateMetrics,
  CohortMetricComparison,
  CohortMetricId,
} from "./types.js";

function compareNumber(
  metric: CohortMetricId,
  label: string,
  baseline?: number,
  candidate?: number,
  higherIsWorse = true,
  maxRelativeDelta?: number,
): CohortMetricComparison | undefined {
  if (baseline === undefined && candidate === undefined) return undefined;
  const delta =
    baseline !== undefined && candidate !== undefined
      ? candidate - baseline
      : undefined;
  let regression =
    delta !== undefined &&
    ((higherIsWorse && delta > 0) || (!higherIsWorse && delta < 0));
  if (
    regression &&
    maxRelativeDelta !== undefined &&
    baseline !== undefined &&
    baseline !== 0 &&
    delta !== undefined
  ) {
    const relative = Math.abs(delta / baseline);
    if (relative <= maxRelativeDelta) regression = false;
  }
  return {
    metric,
    baseline,
    candidate,
    delta,
    regression,
    message: `${label}: baseline=${baseline ?? "n/a"} candidate=${candidate ?? "n/a"}${
      delta !== undefined ? ` (delta ${delta})` : ""
    }`,
  };
}

function pickAggregate(
  groups: readonly CohortAggregateMetrics[],
  cohortLabel: string,
  groupKey?: string,
): CohortAggregateMetrics | undefined {
  return groups.find(
    (group) =>
      group.cohortLabel === cohortLabel &&
      (groupKey === undefined || group.groupKey === groupKey),
  );
}

export function compareCohortAggregates(
  groups: readonly CohortAggregateMetrics[],
  options: {
    baseline: string;
    candidate: string;
    metrics: readonly CohortMetricId[];
    groupKey?: string;
    maxRelativeDelta?: number;
  },
): CohortMetricComparison[] {
  const baselineAgg = pickAggregate(groups, options.baseline, options.groupKey);
  const candidateAgg = pickAggregate(groups, options.candidate, options.groupKey);
  const comparisons: CohortMetricComparison[] = [];
  const tolerance = options.maxRelativeDelta;

  for (const metric of options.metrics) {
    switch (metric) {
      case "errorRate": {
        const item = compareNumber(
          metric,
          "Error rate",
          baselineAgg?.errorRate,
          candidateAgg?.errorRate,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "duration": {
        const item = compareNumber(
          metric,
          "Average duration (ms)",
          baselineAgg?.avgDurationMs,
          candidateAgg?.avgDurationMs,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "llmCallCount": {
        const item = compareNumber(
          metric,
          "Average LLM calls",
          baselineAgg?.avgLlmCallCount,
          candidateAgg?.avgLlmCallCount,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "tokenUsage": {
        const item = compareNumber(
          metric,
          "Average token usage",
          baselineAgg?.avgTokenUsage,
          candidateAgg?.avgTokenUsage,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "retryCount": {
        const item = compareNumber(
          metric,
          "Average retries",
          baselineAgg?.avgRetryCount,
          candidateAgg?.avgRetryCount,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "observationFailure": {
        const item = compareNumber(
          metric,
          "Observation failure rate",
          baselineAgg?.observationFailureRate,
          candidateAgg?.observationFailureRate,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "toolChoice": {
        const baselineValue = baselineAgg?.dominantToolChoice;
        const candidateValue = candidateAgg?.dominantToolChoice;
        comparisons.push({
          metric,
          baseline: baselineValue,
          candidate: candidateValue,
          delta: baselineValue === candidateValue ? "same" : "changed",
          regression: baselineValue !== candidateValue,
          message: `Tool choice: baseline=${baselineValue ?? "n/a"} candidate=${candidateValue ?? "n/a"}`,
        });
        break;
      }
      case "toolOrdering": {
        const baselineValue = baselineAgg?.toolOrderingSignature;
        const candidateValue = candidateAgg?.toolOrderingSignature;
        comparisons.push({
          metric,
          baseline: baselineValue,
          candidate: candidateValue,
          delta: baselineValue === candidateValue ? "same" : "changed",
          regression: baselineValue !== candidateValue,
          message: `Tool ordering: baseline=${baselineValue ?? "n/a"} candidate=${candidateValue ?? "n/a"}`,
        });
        break;
      }
      case "guardrailFailure": {
        const item = compareNumber(
          metric,
          "Guardrail failures",
          baselineAgg?.avgGuardrailFailures,
          candidateAgg?.avgGuardrailFailures,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "circuitViolation": {
        const item = compareNumber(
          metric,
          "Circuit violations",
          baselineAgg?.avgCircuitViolations,
          candidateAgg?.avgCircuitViolations,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      case "redactionWarning": {
        const item = compareNumber(
          metric,
          "Redaction warnings",
          baselineAgg?.avgRedactionWarnings,
          candidateAgg?.avgRedactionWarnings,
          true,
          tolerance,
        );
        if (item) comparisons.push(item);
        break;
      }
      default:
        break;
    }
  }

  return comparisons;
}
