import { extractOutcomesFromTraceEvents } from "../outcomes/extract.js";
import { readTraceEventsFromFile } from "../storage.js";
import { computeCohortRunMetrics } from "../cohort/metrics.js";
import type { SessionRunRecord } from "../sessions/types.js";
import type { GateCheckResult, RunGateOptions } from "./types.js";

function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

function hasThresholds(options: RunGateOptions): boolean {
  return (
    options.maxErrorRate !== undefined ||
    options.maxP95DurationMs !== undefined ||
    (options.forbidTools?.length ?? 0) > 0 ||
    (options.requireObservations?.length ?? 0) > 0
  );
}

export function gateHasThresholds(options: RunGateOptions): boolean {
  return hasThresholds(options);
}

async function loadRunMetrics(runs: readonly SessionRunRecord[]) {
  const metrics = [];
  for (const run of runs) {
    if (run.filePath === undefined) continue;
    metrics.push(
      await computeCohortRunMetrics({
        runId: run.runId,
        filePath: run.filePath,
        metadata: run.metadata,
        status: run.status,
        durationMs: run.durationMs,
        groupKey: "all",
      }),
    );
  }
  return metrics;
}

async function observationStatus(
  filePath: string,
  name: string,
): Promise<"passed" | "failed" | "missing"> {
  const events = await readTraceEventsFromFile(filePath);
  const outcomes = extractOutcomesFromTraceEvents(events);
  const match = outcomes.find((item) => item.name === name);
  if (!match) return "missing";
  return match.status === "passed" ? "passed" : "failed";
}

export async function evaluateGateThresholds(
  runs: readonly SessionRunRecord[],
  options: RunGateOptions,
): Promise<{ checks: GateCheckResult[]; readErrors: string[] }> {
  const checks: GateCheckResult[] = [];
  const readErrors: string[] = [];

  if (!hasThresholds(options)) {
    return { checks, readErrors };
  }

  if (runs.length === 0) {
    readErrors.push("No trace runs found in the gate directory.");
    return { checks, readErrors };
  }

  let runMetrics;
  try {
    runMetrics = await loadRunMetrics(runs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    readErrors.push(message);
    return { checks, readErrors };
  }

  if (options.maxErrorRate !== undefined) {
    const errors = runMetrics.filter((run) => run.error).length;
    const actual = runMetrics.length > 0 ? (errors / runMetrics.length) * 100 : 0;
    const ok = actual <= options.maxErrorRate;
    checks.push({
      id: "maxErrorRate",
      name: "Max error rate",
      ok,
      expected: options.maxErrorRate,
      actual: Math.round(actual * 10) / 10,
      message: ok
        ? `Error rate ${actual.toFixed(1)}% within limit ${options.maxErrorRate}%`
        : `Error rate ${actual.toFixed(1)}% exceeds limit ${options.maxErrorRate}%`,
    });
  }

  if (options.maxP95DurationMs !== undefined) {
    const durations = runMetrics
      .map((run) => run.durationMs)
      .filter((value): value is number => typeof value === "number");
    const actual = percentile(durations, 95);
    const ok = actual !== undefined && actual <= options.maxP95DurationMs;
    checks.push({
      id: "maxP95Duration",
      name: "Max p95 duration (ms)",
      ok,
      expected: options.maxP95DurationMs,
      actual: actual ?? "n/a",
      message:
        actual === undefined
          ? "No duration samples available for p95 check."
          : ok
            ? `P95 duration ${Math.round(actual)} ms within limit ${options.maxP95DurationMs} ms`
            : `P95 duration ${Math.round(actual)} ms exceeds limit ${options.maxP95DurationMs} ms`,
    });
  }

  for (const tool of options.forbidTools ?? []) {
    let violated = false;
    for (const run of runMetrics) {
      const used =
        run.toolChoices.includes(tool) || run.toolOrdering.includes(tool);
      if (used) {
        violated = true;
        checks.push({
          id: "forbidTool",
          name: `Forbid tool: ${tool}`,
          ok: false,
          expected: `not used`,
          actual: "used",
          runId: run.runId,
          message: `Forbidden tool "${tool}" used in run ${run.runId}`,
        });
      }
    }
    if (!violated) {
      checks.push({
        id: "forbidTool",
        name: `Forbid tool: ${tool}`,
        ok: true,
        message: `Forbidden tool "${tool}" not used`,
      });
    }
  }

  for (const observation of options.requireObservations ?? []) {
    for (const run of runs) {
      if (run.filePath === undefined) continue;
      try {
        const status = await observationStatus(run.filePath, observation);
        const ok = status === "passed";
        checks.push({
          id: "requireObservation",
          name: `Require observation: ${observation}`,
          ok,
          expected: "passed",
          actual: status,
          runId: run.runId,
          message: ok
            ? `Observation "${observation}" passed in run ${run.runId}`
            : status === "missing"
              ? `Observation "${observation}" missing in run ${run.runId}`
              : `Observation "${observation}" failed in run ${run.runId}`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        readErrors.push(`Run ${run.runId}: ${message}`);
      }
    }
  }

  return { checks, readErrors };
}

export function checksFromSuiteResult(
  suiteResult: import("../suite/types.js").SuiteRunResult,
): GateCheckResult[] {
  const checks: GateCheckResult[] = [
    {
      id: "suite",
      name: `Suite: ${suiteResult.suiteName}`,
      ok: suiteResult.ok,
      message: suiteResult.ok
        ? `Suite passed (${suiteResult.summary.passed} cases)`
        : `Suite failed (${suiteResult.summary.failed} failed, ${suiteResult.summary.errors} errors)`,
    },
  ];

  for (const suiteCase of suiteResult.cases) {
    if (suiteCase.status === "pass") continue;
    checks.push({
      id: "suite",
      name: `Case: ${suiteCase.id}`,
      ok: false,
      message: suiteCase.message ?? `Case status: ${suiteCase.status}`,
    });
  }

  return checks;
}
