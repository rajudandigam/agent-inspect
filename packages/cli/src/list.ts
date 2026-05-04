import {
  formatDuration,
  formatTimestamp,
  getDefaultTraceDir,
  listTraceFiles,
  readTraceEvents,
  getRunIdFromTraceFileName,
  truncateName,
} from "@agent-inspect/core";
import type {
  RunCompletedEvent,
  RunStartedEvent,
  TraceEvent,
} from "@agent-inspect/core";

export interface ListOptions {
  dir?: string;
  limit?: string;
  status?: "running" | "success" | "error";
}

type RunSummary = {
  runId: string;
  name: string;
  status: "running" | "success" | "error";
  durationMs?: number;
  startTime: number;
};

function parseLimit(raw?: string): number {
  const fallback = 20;
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function isStatusFilter(
  value: unknown,
): value is "running" | "success" | "error" {
  return value === "running" || value === "success" || value === "error";
}

function buildRunSummary(
  runId: string,
  events: TraceEvent[],
): RunSummary | undefined {
  const started = events.find(
    (e): e is RunStartedEvent => e.event === "run_started",
  );
  if (!started) return undefined;

  const completed = events.filter(
    (e): e is RunCompletedEvent => e.event === "run_completed",
  );
  const last = completed[completed.length - 1];

  const status: RunSummary["status"] = last ? last.status : "running";
  const startTime = Number.isFinite(started.startTime)
    ? started.startTime
    : Number.isFinite(started.timestamp)
      ? started.timestamp
      : 0;

  const name =
    typeof started.name === "string" && started.name.trim() !== ""
      ? started.name.trim()
      : "unknown-run";

  return {
    runId,
    name,
    status,
    durationMs: last !== undefined ? last.durationMs : undefined,
    startTime,
  };
}

function statusIcon(status: RunSummary["status"]): string {
  if (status === "success") return "✓";
  if (status === "error") return "✗";
  return "⏳";
}

function durationCell(
  status: RunSummary["status"],
  durationMs?: number,
): string {
  if (status === "running") return "-";
  if (durationMs !== undefined && Number.isFinite(durationMs)) {
    return formatDuration(durationMs);
  }
  return "-";
}

function timestampCell(startTime: number): string {
  if (!Number.isFinite(startTime) || startTime <= 0) return "Invalid date";
  const s = formatTimestamp(startTime);
  return s === "Invalid date" ? "Invalid date" : s;
}

/**
 * Prints a table of recent runs under the trace directory. Swallows expected I/O issues;
 * unexpected failures set `process.exitCode` and log a short message (no `process.exit`).
 */
export async function list(options: ListOptions = {}): Promise<void> {
  try {
    const traceDir =
      typeof options.dir === "string" && options.dir.trim() !== ""
        ? options.dir.trim()
        : getDefaultTraceDir();

    const files = await listTraceFiles(traceDir);
    if (files.length === 0) {
      console.log("No AgentInspect runs found");
      console.log(`Trace directory: ${traceDir}`);
      return;
    }

    const summaries: RunSummary[] = [];
    for (const fileName of files) {
      try {
        const runId = getRunIdFromTraceFileName(fileName);
        if (runId === undefined) continue;
        const events = await readTraceEvents(runId, traceDir);
        const row = buildRunSummary(runId, events);
        if (row !== undefined) summaries.push(row);
      } catch {
        /* skip malformed */
      }
    }

    if (summaries.length === 0) {
      console.log("No AgentInspect runs found");
      console.log(`Trace directory: ${traceDir}`);
      return;
    }

    summaries.sort((a, b) => b.startTime - a.startTime);

    const statusFilter = isStatusFilter(options.status)
      ? options.status
      : undefined;
    const filtered =
      statusFilter === undefined
        ? summaries
        : summaries.filter((s) => s.status === statusFilter);

    const limit = parseLimit(options.limit);
    const shown = filtered.slice(0, limit);

    console.log("Recent AgentInspect Runs");
    for (const s of shown) {
      const icon = statusIcon(s.status);
      const dur = durationCell(s.status, s.durationMs);
      const ts = timestampCell(s.startTime);
      const nm = truncateName(s.name, 80);
      console.log(`${icon} ${s.runId} | ${nm} | ${dur} | ${ts}`);
    }

    console.log("");
    console.log(`Showing ${shown.length} of ${filtered.length} runs`);
    console.log(`Trace directory: ${traceDir}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] list failed: ${msg}`);
    process.exitCode = 1;
  }
}
