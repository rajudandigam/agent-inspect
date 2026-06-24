import {
  parseTraceJsonl,
  readTraceFile,
  unknownTraceFormatMessage,
  type TraceEvent,
} from "@agent-inspect/core";

export interface ReadRunTraceResult {
  events: TraceEvent[];
  format: "0.1" | "0.2" | "mixed" | "empty";
}

/**
 * Shared CLI read path: loads a run JSONL file and normalizes v0.1 + v0.2 rows.
 */
export async function readRunTraceEvents(
  runId: string,
  traceDir: string,
): Promise<ReadRunTraceResult | undefined> {
  const raw = await readTraceFile(runId, traceDir);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = parseTraceJsonl(raw);
  if (parsed.format === "empty") {
    return { events: [], format: "empty" };
  }
  return { events: parsed.events, format: parsed.format };
}

export { unknownTraceFormatMessage };
