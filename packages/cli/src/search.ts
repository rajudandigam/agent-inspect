import {
  TraceDirectory,
  loadTraceMetadataList,
  parseDuration,
  parseDurationFilter,
  resolveTraceDir,
  searchTraces,
} from "@agent-inspect/core/advanced";

export interface SearchCommandOptions {
  dir?: string;
  since?: string;
  status?: string;
  kind?: string;
  type?: string;
  name?: string;
  tool?: string;
  duration?: string;
  limit?: string;
  json?: boolean;
}

function parseLimit(raw?: string): number {
  if (raw === undefined || raw.trim() === "") return 50;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(n, 500);
}

export async function searchCommand(
  options: SearchCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const td = new TraceDirectory({ dir: traceDir });

    if (typeof options.since === "string" && options.since.trim() !== "") {
      parseDuration(options.since.trim());
    }
    if (options.duration) {
      parseDurationFilter(options.duration);
    }

    const files = await td.list();
    const metas = await loadTraceMetadataList(traceDir, files, (f) =>
      td.getPath(f),
    );

    const status =
      options.status === "success" ||
      options.status === "error" ||
      options.status === "running" ||
      options.status === "unknown"
        ? options.status
        : undefined;

    const results = await searchTraces(metas, {
      traceDir,
      since: options.since,
      status,
      kind: options.kind,
      type: options.type,
      name: options.name,
      tool: options.tool,
      duration: options.duration,
      limit: parseLimit(options.limit),
    });

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.length === 0) {
      console.log("No matching traces found");
      console.log(`Trace directory: ${traceDir}`);
      return;
    }

    console.log(`Search results (${results.length})`);
    for (const r of results) {
      const step =
        r.stepName !== undefined
          ? ` | ${r.stepType ?? "step"}:${r.stepName}`
          : "";
      const dur =
        r.durationMs !== undefined ? ` | ${r.durationMs}ms` : "";
      console.log(
        `${r.runId}${step} | ${r.runStatus}${dur} | ${r.matchReason}`,
      );
    }
    console.log("");
    console.log(`Trace directory: ${traceDir}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] search failed: ${msg}`);
    process.exitCode = 1;
  }
}
