import { persistedInspectEventToTraceEvents } from "./persisted/to-trace-event.js";
import { isPersistedInspectEvent } from "./types/persisted-inspect-event.js";
import type { PersistedInspectEvent } from "./types/persisted-inspect-event.js";
import { isTraceEvent } from "./types.js";
import type { TraceEvent } from "./types.js";
import { warn } from "./utils.js";

export type TraceJsonlFormat = "0.1" | "0.2" | "1.0" | "mixed" | "empty";

export type ParsedTraceJsonlRow =
  | { format: "0.1"; event: TraceEvent; sourceLine: number }
  | { format: "0.2"; event: PersistedInspectEvent; sourceLine: number }
  | { format: "1.0"; event: PersistedInspectEvent; sourceLine: number };

export interface ParseTraceJsonlResult {
  format: TraceJsonlFormat;
  /** Count of valid source JSONL rows before any one-to-many normalization. */
  sourceEventCount: number;
  events: TraceEvent[];
  persisted: PersistedInspectEvent[];
  /** Valid source rows in JSONL order, before cross-version normalization. */
  rows: ParsedTraceJsonlRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function detectLineFormat(parsed: unknown): "0.1" | "0.2" | "1.0" | "unknown" {
  if (!isRecord(parsed)) return "unknown";
  if (parsed.schemaVersion === "0.1") return "0.1";
  if (parsed.schemaVersion === "0.2") return "0.2";
  if (parsed.schemaVersion === "1.0") return "1.0";
  return "unknown";
}

export interface ParseTraceJsonlOptions {
  validate?: (value: unknown) => value is TraceEvent;
  /** Emit parse warnings through the standard AgentInspect warning channel (default true). */
  warnings?: boolean;
}

/**
 * Parses JSONL content into normalized v0.1 {@link TraceEvent} rows.
 * Accepts homogenous v0.1, v0.2, or v1.0 files; mixed files are converted with a warning.
 */
export function parseTraceJsonl(
  raw: string,
  options: ParseTraceJsonlOptions = {},
): ParseTraceJsonlResult {
  const validate = options.validate ?? isTraceEvent;
  const emitWarning = (message: string): void => {
    if (options.warnings !== false) warn(message);
  };
  const persisted: PersistedInspectEvent[] = [];
  const traceEvents: TraceEvent[] = [];
  const rows: ParsedTraceJsonlRow[] = [];
  let sourceEventCount = 0;
  let saw01 = false;
  let saw02 = false;
  let saw10 = false;
  let lineNumber = 0;

  for (const line of raw.split(/\r?\n/)) {
    lineNumber += 1;
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      emitWarning("Skipped invalid JSON line in trace file");
      continue;
    }

    const format = detectLineFormat(parsed);
    if (format === "0.1") {
      saw01 = true;
      if (validate(parsed)) {
        sourceEventCount += 1;
        traceEvents.push(parsed);
        rows.push({ format: "0.1", event: parsed, sourceLine: lineNumber });
      } else {
        emitWarning("Skipped invalid trace event line in trace file");
      }
      continue;
    }

    if (format === "0.2" || format === "1.0") {
      if (format === "0.2") saw02 = true;
      else saw10 = true;
      if (isPersistedInspectEvent(parsed)) {
        sourceEventCount += 1;
        persisted.push(parsed);
        rows.push({ format, event: parsed, sourceLine: lineNumber });
        traceEvents.push(...persistedInspectEventToTraceEvents(parsed));
      } else {
        emitWarning("Skipped invalid persisted inspect event line in trace file");
      }
      continue;
    }

    emitWarning("Skipped trace line with unknown schemaVersion");
  }

  const seenFormats = [saw01, saw02, saw10].filter(Boolean).length;
  if (seenFormats > 1) {
    emitWarning(
      "Trace file mixes AgentInspect schemaVersion rows; normalizing all rows",
    );
  }

  let format: TraceJsonlFormat = "empty";
  if (seenFormats > 1) format = "mixed";
  else if (saw01) format = "0.1";
  else if (saw02) format = "0.2";
  else if (saw10) format = "1.0";

  return { format, sourceEventCount, events: traceEvents, persisted, rows };
}

/**
 * Returns a user-facing message when a trace file uses an unsupported schema version.
 */
export function unknownTraceFormatMessage(): string {
  return (
    "Unsupported trace format. Expected schemaVersion 0.1 (TraceEvent), 0.2 (PersistedInspectEvent), or 1.0 (PersistedInspectEvent)."
  );
}
