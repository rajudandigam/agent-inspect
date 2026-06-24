import { persistedInspectEventsToTraceEvents } from "./persisted/to-trace-event.js";
import { isPersistedInspectEvent } from "./types/persisted-inspect-event.js";
import type { PersistedInspectEvent } from "./types/persisted-inspect-event.js";
import { isTraceEvent } from "./types.js";
import type { TraceEvent } from "./types.js";
import { warn } from "./utils.js";

export type TraceJsonlFormat = "0.1" | "0.2" | "mixed" | "empty";

export interface ParseTraceJsonlResult {
  format: TraceJsonlFormat;
  events: TraceEvent[];
  persisted: PersistedInspectEvent[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function detectLineFormat(parsed: unknown): "0.1" | "0.2" | "unknown" {
  if (!isRecord(parsed)) return "unknown";
  if (parsed.schemaVersion === "0.1") return "0.1";
  if (parsed.schemaVersion === "0.2") return "0.2";
  return "unknown";
}

export interface ParseTraceJsonlOptions {
  validate?: (value: unknown) => value is TraceEvent;
}

/**
 * Parses JSONL content into normalized v0.1 {@link TraceEvent} rows.
 * Accepts homogenous v0.1 or v0.2 files; mixed files are converted with a warning.
 */
export function parseTraceJsonl(
  raw: string,
  options: ParseTraceJsonlOptions = {},
): ParseTraceJsonlResult {
  const validate = options.validate ?? isTraceEvent;
  const persisted: PersistedInspectEvent[] = [];
  const traceEvents: TraceEvent[] = [];
  let saw01 = false;
  let saw02 = false;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      warn("Skipped invalid JSON line in trace file");
      continue;
    }

    const format = detectLineFormat(parsed);
    if (format === "0.1") {
      saw01 = true;
      if (validate(parsed)) {
        traceEvents.push(parsed);
      } else {
        warn("Skipped invalid trace event line in trace file");
      }
      continue;
    }

    if (format === "0.2") {
      saw02 = true;
      if (isPersistedInspectEvent(parsed)) {
        persisted.push(parsed);
      } else {
        warn("Skipped invalid persisted inspect event line in trace file");
      }
      continue;
    }

    warn("Skipped trace line with unknown schemaVersion");
  }

  if (saw01 && saw02) {
    warn("Trace file mixes schemaVersion 0.1 and 0.2 lines; normalizing all rows");
  }

  const converted = persisted.length > 0 ? persistedInspectEventsToTraceEvents(persisted) : [];
  const events = [...traceEvents, ...converted];

  let format: TraceJsonlFormat = "empty";
  if (saw01 && saw02) format = "mixed";
  else if (saw01) format = "0.1";
  else if (saw02) format = "0.2";

  return { format, events, persisted };
}

/**
 * Returns a user-facing message when a trace file uses an unsupported schema version.
 */
export function unknownTraceFormatMessage(): string {
  return (
    "Unsupported trace format. Expected schemaVersion 0.1 (TraceEvent) or 0.2 (PersistedInspectEvent)."
  );
}
