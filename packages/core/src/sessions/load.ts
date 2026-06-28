import { readTraceEventsFromFile } from "../storage.js";
import type { TraceMetadata } from "../types.js";
import type { SessionRunRecord } from "./types.js";

/** Enriches trace metadata with run_started metadata for session indexing. */
export async function enrichSessionRunRecord(
  meta: TraceMetadata,
): Promise<SessionRunRecord> {
  let metadata: Record<string, unknown> | undefined;
  try {
    const events = await readTraceEventsFromFile(meta.filePath);
    for (const event of events) {
      if (event.event !== "run_started") continue;
      if (event.metadata && typeof event.metadata === "object") {
        metadata = event.metadata as Record<string, unknown>;
      }
      break;
    }
  } catch {
    /* skip */
  }

  return {
    runId: meta.runId,
    name: meta.name,
    status: meta.status,
    startedAt: meta.startedAt,
    endedAt: meta.endedAt,
    durationMs: meta.durationMs,
    filePath: meta.filePath,
    metadata,
  };
}

/** Builds session run records from extracted trace metadata rows. */
export async function loadSessionRunRecords(
  metas: readonly TraceMetadata[],
): Promise<SessionRunRecord[]> {
  const out: SessionRunRecord[] = [];
  for (const meta of metas) {
    out.push(await enrichSessionRunRecord(meta));
  }
  return out;
}
