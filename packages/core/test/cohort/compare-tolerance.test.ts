import { describe, expect, it } from "vitest";

import {
  compareCohortAggregates,
  type CohortAggregateMetrics,
  type CohortMetricId,
} from "../../src/entries/advanced.js";

function aggregate(
  cohortLabel: string,
  overrides: Partial<CohortAggregateMetrics> = {},
): CohortAggregateMetrics {
  return {
    groupKey: "all",
    cohortLabel,
    runCount: 10,
    errorRate: 0.1,
    avgDurationMs: 100,
    avgLlmCallCount: 4,
    avgTokenUsage: 1000,
    avgRetryCount: 1,
    observationFailureRate: 0.1,
    avgGuardrailFailures: 1,
    avgCircuitViolations: 1,
    avgRedactionWarnings: 1,
    ...overrides,
  };
}

const NUMERIC_METRICS: Array<{
  metric: CohortMetricId;
  field: keyof CohortAggregateMetrics;
  baseline: number;
  withinTolerance: number;
  beyondTolerance: number;
}> = [
  { metric: "errorRate", field: "errorRate", baseline: 0.1, withinTolerance: 0.105, beyondTolerance: 0.2 },
  { metric: "duration", field: "avgDurationMs", baseline: 100, withinTolerance: 105, beyondTolerance: 200 },
  { metric: "llmCallCount", field: "avgLlmCallCount", baseline: 4, withinTolerance: 4.2, beyondTolerance: 8 },
  { metric: "tokenUsage", field: "avgTokenUsage", baseline: 1000, withinTolerance: 1050, beyondTolerance: 2000 },
  { metric: "retryCount", field: "avgRetryCount", baseline: 1, withinTolerance: 1.05, beyondTolerance: 2 },
  { metric: "observationFailure", field: "observationFailureRate", baseline: 0.1, withinTolerance: 0.105, beyondTolerance: 0.2 },
  { metric: "guardrailFailure", field: "avgGuardrailFailures", baseline: 1, withinTolerance: 1.05, beyondTolerance: 2 },
  { metric: "circuitViolation", field: "avgCircuitViolations", baseline: 1, withinTolerance: 1.05, beyondTolerance: 2 },
  { metric: "redactionWarning", field: "avgRedactionWarnings", baseline: 1, withinTolerance: 1.05, beyondTolerance: 2 },
];

/**
 * maxRelativeDelta is documented generically ("Allowed relative delta (0-1)
 * before a metric comparison is a regression"), so it must gate every numeric
 * metric, not just errorRate.
 */
describe("cohort compare maxRelativeDelta tolerance", () => {
  for (const { metric, field, baseline, withinTolerance, beyondTolerance } of NUMERIC_METRICS) {
    it(`${metric}: within-tolerance delta is not a regression`, () => {
      const comparisons = compareCohortAggregates(
        [
          aggregate("before", { [field]: baseline }),
          aggregate("after", { [field]: withinTolerance }),
        ],
        {
          baseline: "before",
          candidate: "after",
          metrics: [metric],
          maxRelativeDelta: 0.1,
        },
      );

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0]?.metric).toBe(metric);
      expect(comparisons[0]?.regression).toBe(false);
    });

    it(`${metric}: beyond-tolerance delta stays a regression`, () => {
      const comparisons = compareCohortAggregates(
        [
          aggregate("before", { [field]: baseline }),
          aggregate("after", { [field]: beyondTolerance }),
        ],
        {
          baseline: "before",
          candidate: "after",
          metrics: [metric],
          maxRelativeDelta: 0.1,
        },
      );

      expect(comparisons[0]?.regression).toBe(true);
    });

    it(`${metric}: without tolerance any worsening delta is a regression`, () => {
      const comparisons = compareCohortAggregates(
        [
          aggregate("before", { [field]: baseline }),
          aggregate("after", { [field]: withinTolerance }),
        ],
        {
          baseline: "before",
          candidate: "after",
          metrics: [metric],
        },
      );

      expect(comparisons[0]?.regression).toBe(true);
    });
  }

  it("categorical toolChoice changes are unaffected by tolerance", () => {
    const comparisons = compareCohortAggregates(
      [
        aggregate("before", { dominantToolChoice: "search" }),
        aggregate("after", { dominantToolChoice: "browse" }),
      ],
      {
        baseline: "before",
        candidate: "after",
        metrics: ["toolChoice"],
        maxRelativeDelta: 0.5,
      },
    );

    expect(comparisons[0]?.regression).toBe(true);
  });
});
