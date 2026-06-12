import { readFile } from "node:fs/promises";

import type { RunStartedEvent, TraceEvent, TraceMetadata } from "./types.js";
import { buildRunSummary } from "./trace-metadata.js";
import { filterTraces } from "./trace-filter.js";
import { readTraceEvents } from "./storage.js";
import { isTraceEvent } from "./types.js";
import { formatDuration } from "./utils.js";

export interface DurationStats {
  minMs?: number;
  maxMs?: number;
  avgMs?: number;
  p50Ms?: number;
  p95Ms?: number;
}

export interface TraceStatsRankedRun {
  runId: string;
  name?: string;
  durationMs?: number;
  status: string;
}

export interface TraceStatsRankedStep {
  runId: string;
  stepName: string;
  stepType: string;
  durationMs: number;
}

export interface TraceStats {
  traceDir: string;
  since?: string;
  correlationId?: string;
  groupId?: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  runningCount: number;
  unknownCount: number;
  errorRate: number;
  duration: DurationStats;
  totalSteps: number;
  avgStepsPerRun: number;
  totalLlmSteps: number;
  totalToolSteps: number;
  totalErrorSteps: number;
  slowestRuns: TraceStatsRankedRun[];
  slowestSteps: TraceStatsRankedStep[];
}

export interface TraceStatsOptions {
  traceDir: string;
  since?: string;
  correlationId?: string;
  groupId?: string;
  slowRunLimit?: number;
  slowStepLimit?: number;
}

function percentile(sorted: number[], p: number): number | undefined {
  if (sorted.length === 0) return undefined;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

async function readRunStartedMetadata(
  filePath: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const raw = await readFile(filePath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed) as unknown;
      } catch {
        continue;
      }
      if (!isTraceEvent(parsed)) continue;
      if (parsed.event !== "run_started") continue;
      const rs = parsed as RunStartedEvent;
      if (rs.metadata && typeof rs.metadata === "object") {
        return rs.metadata as Record<string, unknown>;
      }
      return undefined;
    }
  } catch {
    /* skip */
  }
  return undefined;
}

function metaMatchesCorrelation(
  metadata: Record<string, unknown> | undefined,
  correlationId?: string,
  groupId?: string,
): boolean {
  if (correlationId) {
    const v = metadata?.correlationId;
    if (typeof v !== "string" || v !== correlationId) return false;
  }
  if (groupId) {
    const v = metadata?.groupId;
    if (typeof v !== "string" || v !== groupId) return false;
  }
  return true;
}

export async function buildTraceStats(
  metas: TraceMetadata[],
  options: TraceStatsOptions,
): Promise<TraceStats> {
  let filtered = filterTraces(metas, { since: options.since });

  if (options.correlationId || options.groupId) {
    const next: TraceMetadata[] = [];
    for (const m of filtered) {
      const md = await readRunStartedMetadata(m.filePath);
      if (metaMatchesCorrelation(md, options.correlationId, options.groupId)) {
        next.push(m);
      }
    }
    filtered = next;
  }

  let successCount = 0;
  let errorCount = 0;
  let runningCount = 0;
  let unknownCount = 0;
  const durations: number[] = [];
  let totalSteps = 0;
  let totalLlmSteps = 0;
  let totalToolSteps = 0;
  let totalErrorSteps = 0;
  const slowestRuns: TraceStatsRankedRun[] = [];
  const slowestSteps: TraceStatsRankedStep[] = [];

  for (const m of filtered) {
    if (m.status === "success") successCount += 1;
    else if (m.status === "error") errorCount += 1;
    else if (m.status === "running") runningCount += 1;
    else unknownCount += 1;

    if (
      typeof m.durationMs === "number" &&
      Number.isFinite(m.durationMs) &&
      m.durationMs >= 0
    ) {
      durations.push(m.durationMs);
      slowestRuns.push({
        runId: m.runId,
        name: m.name,
        durationMs: m.durationMs,
        status: m.status,
      });
    }

    try {
      const events = await readTraceEvents(m.runId, options.traceDir);
      if (events.length === 0) continue;
      const summary = buildRunSummary(events);
      totalSteps += summary.totalSteps;
      totalLlmSteps += summary.llmSteps;
      totalToolSteps += summary.toolSteps;
      totalErrorSteps += summary.errorSteps;

      const steps = collectCompletedSteps(events, m.runId);
      for (const s of steps) {
        slowestSteps.push(s);
      }
    } catch {
      /* skip malformed */
    }
  }

  slowestRuns.sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
  slowestSteps.sort((a, b) => b.durationMs - a.durationMs);

  const runLimit = options.slowRunLimit ?? 5;
  const stepLimit = options.slowStepLimit ?? 5;
  const sortedDur = [...durations].sort((a, b) => a - b);
  const totalRuns = filtered.length;
  const errorRate = totalRuns > 0 ? errorCount / totalRuns : 0;
  const sumDur = durations.reduce((a, b) => a + b, 0);

  return {
    traceDir: options.traceDir,
    ...(options.since ? { since: options.since } : {}),
    ...(options.correlationId ? { correlationId: options.correlationId } : {}),
    ...(options.groupId ? { groupId: options.groupId } : {}),
    totalRuns,
    successCount,
    errorCount,
    runningCount,
    unknownCount,
    errorRate,
    duration: {
      ...(sortedDur.length > 0
        ? {
            minMs: sortedDur[0],
            maxMs: sortedDur[sortedDur.length - 1],
            avgMs: sumDur / sortedDur.length,
            p50Ms: percentile(sortedDur, 50),
            p95Ms: percentile(sortedDur, 95),
          }
        : {}),
    },
    totalSteps,
    avgStepsPerRun: totalRuns > 0 ? totalSteps / totalRuns : 0,
    totalLlmSteps,
    totalToolSteps,
    totalErrorSteps,
    slowestRuns: slowestRuns.slice(0, runLimit),
    slowestSteps: slowestSteps.slice(0, stepLimit),
  };
}

function collectCompletedSteps(
  events: TraceEvent[],
  runId: string,
): TraceStatsRankedStep[] {
  const started = new Map<string, { name: string; type: string }>();
  const out: TraceStatsRankedStep[] = [];
  for (const e of events) {
    if (e.event === "step_started") {
      const s = e as { stepId: string; name: string; type: string };
      started.set(s.stepId, { name: s.name, type: s.type });
    }
    if (e.event === "step_completed") {
      const c = e as {
        stepId: string;
        durationMs?: number;
        status: string;
      };
      if (c.status !== "success" && c.status !== "error") continue;
      if (typeof c.durationMs !== "number" || !Number.isFinite(c.durationMs)) {
        continue;
      }
      const meta = started.get(c.stepId);
      out.push({
        runId,
        stepName: meta?.name ?? c.stepId,
        stepType: meta?.type ?? "logic",
        durationMs: c.durationMs,
      });
    }
  }
  return out;
}

export function renderTraceStats(stats: TraceStats): string {
  const lines: string[] = [];
  lines.push("Trace stats (local)");
  lines.push(`Directory: ${stats.traceDir}`);
  if (stats.since) lines.push(`Since: ${stats.since}`);
  if (stats.correlationId) lines.push(`Correlation ID: ${stats.correlationId}`);
  if (stats.groupId) lines.push(`Group ID: ${stats.groupId}`);
  lines.push("");
  lines.push(`Runs: ${stats.totalRuns}`);
  lines.push(
    `  success: ${stats.successCount}  error: ${stats.errorCount}  running: ${stats.runningCount}  unknown: ${stats.unknownCount}`,
  );
  lines.push(`Error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
  if (stats.duration.avgMs !== undefined) {
    lines.push(
      `Duration: min ${formatDuration(stats.duration.minMs ?? 0)} | avg ${formatDuration(stats.duration.avgMs)} | p50 ${formatDuration(stats.duration.p50Ms ?? 0)} | p95 ${formatDuration(stats.duration.p95Ms ?? 0)} | max ${formatDuration(stats.duration.maxMs ?? 0)}`,
    );
  }
  lines.push("");
  lines.push(`Steps: ${stats.totalSteps} (avg ${stats.avgStepsPerRun.toFixed(1)} per run)`);
  lines.push(
    `  LLM: ${stats.totalLlmSteps}  tool: ${stats.totalToolSteps}  errors: ${stats.totalErrorSteps}`,
  );
  if (stats.slowestRuns.length > 0) {
    lines.push("");
    lines.push("Slowest runs:");
    for (const r of stats.slowestRuns) {
      lines.push(
        `  ${r.runId} | ${r.name ?? "-"} | ${formatDuration(r.durationMs ?? 0)} | ${r.status}`,
      );
    }
  }
  if (stats.slowestSteps.length > 0) {
    lines.push("");
    lines.push("Slowest steps:");
    for (const s of stats.slowestSteps) {
      lines.push(
        `  ${s.runId} | ${s.stepType}:${s.stepName} | ${formatDuration(s.durationMs)}`,
      );
    }
  }
  return lines.join("\n");
}
