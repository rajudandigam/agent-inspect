import type { EventSource, InspectEvent } from "../types/inspect-event.js";
import {
  isPersistedInspectEvent,
  type PersistedEventSourceType,
  type PersistedInspectEvent,
} from "../types/persisted-inspect-event.js";

export interface PersistedToInspectEventOptions {
  /**
   * If true, invalid persisted events are skipped by batch conversion.
   * If false or omitted, invalid events throw.
   */
  skipInvalid?: boolean;
}

function compactAttributes(
  entries: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseIsoToMs(iso: string): { ms: number; invalidTimestamp: boolean } {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return { ms: 0, invalidTimestamp: true };
  }
  return { ms: parsed, invalidTimestamp: false };
}

function mapPersistedSourceToInspect(
  event: PersistedInspectEvent,
): EventSource {
  const attrs = event.attributes ?? {};
  const sourceName = event.source.name;

  if (sourceName === "pino") {
    return {
      type: "pino",
      file: typeof attrs.sourceFile === "string" ? attrs.sourceFile : undefined,
      line: typeof attrs.sourceLine === "number" ? attrs.sourceLine : undefined,
    };
  }
  if (sourceName === "winston") {
    return {
      type: "winston",
      file: typeof attrs.sourceFile === "string" ? attrs.sourceFile : undefined,
      line: typeof attrs.sourceLine === "number" ? attrs.sourceLine : undefined,
    };
  }

  const mapType = (t: PersistedEventSourceType): EventSource["type"] => {
    switch (t) {
      case "manual":
        return "manual";
      case "json-log":
        return "json-log";
      case "log4js":
        return "log4js";
      case "adapter":
      case "ai-sdk":
      case "otel":
        return "adapter";
      default:
        return "json-log";
    }
  };

  return {
    type: mapType(event.source.type),
    file: typeof attrs.sourceFile === "string" ? attrs.sourceFile : undefined,
    line: typeof attrs.sourceLine === "number" ? attrs.sourceLine : undefined,
  };
}

function buildInspectAttributes(event: PersistedInspectEvent): Record<string, unknown> {
  const attrs =
    event.attributes !== undefined ? { ...event.attributes } : {};

  if (event.inputSummary !== undefined) {
    attrs.inputSummary = event.inputSummary;
  }
  if (event.outputSummary !== undefined) {
    attrs.outputSummary = event.outputSummary;
  }

  if (event.error) {
    if (event.error.name !== undefined) {
      attrs.errorName = event.error.name;
    }
    attrs.errorMessage = event.error.message;
    if (event.error.code !== undefined) {
      attrs.errorCode = event.error.code;
    }
  }

  if (event.tokenUsage) {
    attrs.tokens = { ...event.tokenUsage };
  }

  if (event.source.type === "ai-sdk" || event.source.type === "otel") {
    attrs.originalSourceType = event.source.type;
  }

  if (event.source.name !== undefined) {
    attrs.sourceName = event.source.name;
  }
  if (event.source.version !== undefined) {
    attrs.sourceVersion = event.source.version;
  }

  return attrs;
}

/**
 * Maps one v0.2 {@link PersistedInspectEvent} to in-memory {@link InspectEvent}.
 * Throws if `event` fails {@link isPersistedInspectEvent}.
 */
export function persistedInspectEventToInspectEvent(
  event: PersistedInspectEvent,
): InspectEvent {
  if (!isPersistedInspectEvent(event)) {
    throw new Error("Invalid PersistedInspectEvent: failed isPersistedInspectEvent");
  }

  const ts = parseIsoToMs(event.timestamp);
  const attrs = buildInspectAttributes(event);
  if (ts.invalidTimestamp) {
    attrs.invalidTimestamp = true;
  }

  let status: InspectEvent["status"] | undefined;
  if (
    event.status === "running" ||
    event.status === "ok" ||
    event.status === "error"
  ) {
    status = event.status;
  } else if (event.status === "unknown") {
    attrs.persistedStatus = "unknown";
  }

  const out: InspectEvent = {
    eventId: event.eventId,
    runId: event.runId,
    name: event.name,
    kind: event.kind,
    timestamp: ts.ms,
    confidence: event.confidence,
    source: mapPersistedSourceToInspect(event),
    attributes: compactAttributes(attrs),
  };

  if (event.parentId !== undefined) {
    out.parentId = event.parentId;
  }
  if (status !== undefined) {
    out.status = status;
  }
  if (
    event.durationMs !== undefined &&
    Number.isFinite(event.durationMs) &&
    event.durationMs >= 0
  ) {
    out.durationMs = event.durationMs;
  }

  return out;
}

/**
 * Maps persisted v0.2 events to in-memory {@link InspectEvent} rows.
 */
export function persistedInspectEventsToInspectEvents(
  events: readonly PersistedInspectEvent[],
  options?: PersistedToInspectEventOptions,
): InspectEvent[] {
  const skipInvalid = options?.skipInvalid === true;
  const out: InspectEvent[] = [];

  for (const event of events) {
    if (!isPersistedInspectEvent(event)) {
      if (skipInvalid) {
        continue;
      }
      throw new Error("Invalid PersistedInspectEvent: failed isPersistedInspectEvent");
    }
    out.push(persistedInspectEventToInspectEvent(event));
  }

  return out;
}
