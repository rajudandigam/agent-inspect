import type { SessionRunRecord } from "../sessions/types.js";
import { compareCohortAggregates } from "./compare.js";
import {
  filterRunsForCohort,
  parseGroupBySpec,
  resolveCohortLabel,
  resolveRunGroupKey,
} from "./grouping.js";
import { aggregateCohortMetrics, computeCohortRunMetrics } from "./metrics.js";
import {
  COHORT_METRIC_IDS,
  type AnalyzeCohortOptions,
  type CohortAnalysisResult,
  type CohortMetricComparison,
  type CohortMetricId,
} from "./types.js";

const DEFAULT_METRICS: CohortMetricId[] = [
  "errorRate",
  "duration",
  "toolChoice",
  "observationFailure",
];

function normalizeMetrics(metrics: CohortMetricId[] | undefined): CohortMetricId[] {
  if (metrics === undefined || metrics.length === 0) return [...DEFAULT_METRICS];
  const allowed = new Set(COHORT_METRIC_IDS);
  return metrics.filter((metric) => allowed.has(metric));
}

export async function analyzeCohort(
  runsInput: readonly SessionRunRecord[],
  options: AnalyzeCohortOptions,
): Promise<CohortAnalysisResult> {
  const cohortKey = options.cohortKey ?? "cohort";
  const groupBySpec = parseGroupBySpec(options.groupBy);
  const metrics = normalizeMetrics(options.metrics);
  const { runs: filteredRuns, warnings } = filterRunsForCohort(runsInput, {
    cohortKey,
    baseline: options.baseline,
    candidate: options.candidate,
  });

  const runMetrics = [];
  for (const run of filteredRuns) {
    if (run.filePath === undefined) continue;
    const cohortLabel = resolveCohortLabel(
      run,
      cohortKey,
      options.baseline,
      options.candidate,
    );
    runMetrics.push(
      await computeCohortRunMetrics({
        runId: run.runId,
        filePath: run.filePath,
        metadata: run.metadata,
        status: run.status,
        durationMs: run.durationMs,
        groupKey: resolveRunGroupKey(run, groupBySpec),
        cohortLabel,
      }),
    );
  }

  const groupMap = new Map<string, typeof runMetrics>();
  for (const run of runMetrics) {
    const key = `${run.cohortLabel ?? "*"}::${run.groupKey}`;
    const bucket = groupMap.get(key) ?? [];
    bucket.push(run);
    groupMap.set(key, bucket);
  }

  const groups = [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) =>
      aggregateCohortMetrics(
        bucket,
        bucket[0]!.groupKey,
        bucket[0]?.cohortLabel,
      ),
    );

  const comparisons =
    options.baseline !== undefined && options.candidate !== undefined
      ? (() => {
          const groupKeys = [
            ...new Set(groups.map((group) => group.groupKey)),
          ].sort((a, b) => a.localeCompare(b));
          const items: CohortMetricComparison[] = [];
          for (const groupKey of groupKeys) {
            items.push(
              ...compareCohortAggregates(groups, {
                baseline: options.baseline,
                candidate: options.candidate,
                metrics,
                groupKey,
              }),
            );
          }
          return items;
        })()
      : [];

  const regression = comparisons.some((item) => item.regression);

  return {
    ok: !regression,
    traceDir: options.traceDir,
    ...(options.baseline !== undefined ? { baseline: options.baseline } : {}),
    ...(options.candidate !== undefined ? { candidate: options.candidate } : {}),
    cohortKey,
    groupBy: options.groupBy ?? "model",
    metrics,
    groups,
    comparisons,
    runs: runMetrics,
    warnings,
  };
}
