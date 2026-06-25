import { access } from "node:fs/promises";

import {
  getTraceFilePath,
  persistedInspectEventsToTraceEvents,
  unknownTraceFormatMessage,
  type TraceEvent,
} from "@agent-inspect/core";
import { openTrace } from "@agent-inspect/core/readers";

export interface ReadRunTraceResult {
  events: TraceEvent[];
  format: "0.1" | "0.2" | "mixed" | "empty";
}

function mapReaderFormat(format: string): ReadRunTraceResult["format"] {
  switch (format) {
    case "agent-inspect-v0.1-jsonl":
      return "0.1";
    case "agent-inspect-v0.2-jsonl":
      return "0.2";
    case "agent-inspect-mixed-jsonl":
      return "mixed";
    default:
      return "empty";
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/**
 * Shared CLI read path: loads a run JSONL file through the canonical reader
 * pipeline, then adapts persisted reader rows back to legacy TraceEvent rows for
 * existing run-id command compatibility.
 */
export async function readRunTraceEvents(
  runId: string,
  traceDir: string,
): Promise<ReadRunTraceResult | undefined> {
  const filePath = getTraceFilePath(runId, traceDir);
  try {
    await access(filePath);
    const result = await openTrace(
      { type: "file", path: filePath },
      { format: "agent-inspect-jsonl" },
    );
    const events = persistedInspectEventsToTraceEvents(result.events);
    return {
      events,
      format: events.length > 0 ? mapReaderFormat(result.format) : "empty",
    };
  } catch (error) {
    if (isMissingFileError(error)) return undefined;
    throw error;
  }
}

export { unknownTraceFormatMessage };
