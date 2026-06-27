import {
  formatDuration,
  formatTimestamp,
  truncateName,
  TraceDirectory,
  extractMetadata,
  filterTraces,
  parseDuration,
  resolveTraceDir,
  type TraceMetadata,
  type TraceMetadataStatus,
} from "@agent-inspect/core/advanced";

export interface ListOptions {
  dir?: string;
  limit?: string;
  status?: TraceMetadataStatus;
  name?: string;
  since?: string;
  json?: boolean;
}

function parseLimit(raw?: string): number {
  const fallback = 20;
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function statusIcon(status: TraceMetadataStatus): string {
  if (status === "success") return "✓";
  if (status === "error") return "✗";
  if (status === "running") return "⏳";
  return "?";
}

function durationCell(status: TraceMetadataStatus, durationMs?: number): string {
  if (status === "running" || status === "unknown") return "-";
  if (durationMs !== undefined && Number.isFinite(durationMs)) {
    return formatDuration(durationMs);
  }
  return "-";
}

function timestampCell(startedAt?: number, createdAt?: Date): string {
  const t =
    typeof startedAt === "number" && Number.isFinite(startedAt) && startedAt > 0
      ? startedAt
      : createdAt instanceof Date
        ? createdAt.getTime()
        : NaN;
  const s = formatTimestamp(t);
  return s === "Invalid date" ? "Invalid date" : s;
}

/**
 * Prints a table of recent runs under the trace directory. Swallows expected I/O issues;
 * unexpected failures set `process.exitCode` and log a short message (no `process.exit`).
 */
export async function list(options: ListOptions = {}): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const td = new TraceDirectory({ dir: traceDir });

    // Validate filters early so invalid input fails even when no traces exist.
    if (typeof options.since === "string" && options.since.trim() !== "") {
      parseDuration(options.since.trim());
    }

    const files = await td.list();
    if (files.length === 0) {
      if (options.json) {
        console.log("[]");
      } else {
        console.log("No AgentInspect runs found");
        console.log(`Trace directory: ${traceDir}`);
      }
      return;
    }

    const metas: TraceMetadata[] = [];
    for (const fileName of files) {
      try {
        const filePath = td.getPath(fileName);
        const meta = await extractMetadata(filePath);
        metas.push(meta);
      } catch {
        /* skip malformed */
      }
    }

    if (metas.length === 0) {
      if (options.json) {
        console.log("[]");
      } else {
        console.log("No AgentInspect runs found");
        console.log(`Trace directory: ${traceDir}`);
      }
      return;
    }

    const limit = parseLimit(options.limit);
    const filtered = filterTraces(metas, {
      status: options.status,
      name: options.name,
      since: options.since,
      limit,
    });
    const shown = filtered.slice(0, limit);

    if (options.json) {
      console.log(JSON.stringify(shown, null, 2));
      return;
    }

    console.log("Recent AgentInspect Runs");
    for (const s of shown) {
      const icon = statusIcon(s.status);
      const dur = durationCell(s.status, s.durationMs);
      const ts = timestampCell(s.startedAt, s.createdAt);
      const nm = truncateName(s.name ?? "unnamed", 80);
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
