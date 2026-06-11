import type { EventSource, InspectEvent } from "../types/inspect-event.js";
import type {
  PersistedEventSource,
  PersistedEventSourceType,
  PersistedInspectError,
  PersistedInspectEvent,
  PersistedTokenUsage,
} from "../types/persisted-inspect-event.js";

export interface InspectEventToPersistedOptions {
  /**
   * Optional source name override.
   * If omitted, derived from event.source.type.
   */
  sourceName?: string;

  /**
   * Optional source version override.
   */
  sourceVersion?: string;

  /**
   * Stable index for deterministic fallback IDs if needed.
   */
  eventIndex?: number;
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function createFallbackEventId(event: InspectEvent, eventIndex: number): string {
  const runId = sanitizeIdPart(event.runId);
  const kind = sanitizeIdPart(event.kind);
  const name = sanitizeIdPart(event.name);
  return `inspect:${runId}:${kind}:${name}:${eventIndex}`;
}

function toIsoTimestamp(
  ms: number,
): { iso: string; invalidTimestamp: boolean } {
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    return { iso: new Date(0).toISOString(), invalidTimestamp: true };
  }
  return { iso: new Date(ms).toISOString(), invalidTimestamp: false };
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

function mapInspectSourceToPersisted(
  source: EventSource,
  options?: InspectEventToPersistedOptions,
): {
  persistedSource: PersistedEventSource;
  originalSourceType?: EventSource["type"];
} {
  const name = options?.sourceName;
  const version = options?.sourceVersion;

  switch (source.type) {
    case "pino":
      return {
        persistedSource: {
          type: "json-log",
          name: name ?? "pino",
          version,
        },
        originalSourceType: "pino",
      };
    case "winston":
      return {
        persistedSource: {
          type: "json-log",
          name: name ?? "winston",
          version,
        },
        originalSourceType: "winston",
      };
    case "manual":
    case "json-log":
    case "log4js":
    case "adapter":
      return {
        persistedSource: {
          type: source.type as PersistedEventSourceType,
          name,
          version,
        },
      };
    default:
      return {
        persistedSource: {
          type: "json-log",
          name,
          version,
        },
      };
  }
}

function mapTokenUsageFromAttributes(
  attributes: Record<string, unknown> | undefined,
): PersistedTokenUsage | undefined {
  const tokens = attributes?.tokens;
  if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) {
    return undefined;
  }
  const rec = tokens as Record<string, unknown>;
  const input =
    typeof rec.input === "number" && Number.isFinite(rec.input) && rec.input >= 0
      ? rec.input
      : undefined;
  const output =
    typeof rec.output === "number" &&
    Number.isFinite(rec.output) &&
    rec.output >= 0
      ? rec.output
      : undefined;

  if (input === undefined && output === undefined) {
    return undefined;
  }

  const usage: PersistedTokenUsage = {};
  if (input !== undefined) usage.input = input;
  if (output !== undefined) usage.output = output;
  if (input !== undefined && output !== undefined) {
    usage.total = input + output;
  }
  return usage;
}

function mapErrorFromAttributes(
  event: InspectEvent,
): PersistedInspectError | undefined {
  if (event.status !== "error" || !event.attributes) {
    return undefined;
  }
  const message = event.attributes.errorMessage;
  if (typeof message !== "string" || message.length === 0) {
    return undefined;
  }
  const err: PersistedInspectError = { message };
  if (typeof event.attributes.errorName === "string") {
    err.name = event.attributes.errorName;
  }
  return err;
}

/**
 * Maps one in-memory {@link InspectEvent} to a v0.2 {@link PersistedInspectEvent}.
 * Does not mutate `event`.
 */
export function inspectEventToPersistedInspectEvent(
  event: InspectEvent,
  options?: InspectEventToPersistedOptions,
): PersistedInspectEvent {
  const eventIndex = options?.eventIndex ?? 0;
  const eventId =
    typeof event.eventId === "string" && event.eventId.length > 0
      ? event.eventId
      : createFallbackEventId(event, eventIndex);

  const ts = toIsoTimestamp(event.timestamp);
  const { persistedSource, originalSourceType } = mapInspectSourceToPersisted(
    event.source,
    options,
  );

  const attrsBase =
    event.attributes !== undefined ? { ...event.attributes } : {};

  const attributes = compactAttributes({
    ...attrsBase,
    sourceFile: event.source.file,
    sourceLine: event.source.line,
    originalSourceType,
    invalidTimestamp: ts.invalidTimestamp ? true : undefined,
  });

  const tokenUsage = mapTokenUsageFromAttributes(event.attributes);
  const error = mapErrorFromAttributes(event);

  const inputPreview = event.attributes?.inputPreview;
  const outputPreview = event.attributes?.outputPreview;

  const out: PersistedInspectEvent = {
    schemaVersion: "0.2",
    eventId,
    runId: event.runId,
    kind: event.kind,
    name: event.name,
    timestamp: ts.iso,
    confidence: event.confidence,
    source: persistedSource,
    attributes,
  };

  if (event.parentId !== undefined) {
    out.parentId = event.parentId;
  }
  if (event.status !== undefined) {
    out.status = event.status;
  }
  if (
    event.durationMs !== undefined &&
    Number.isFinite(event.durationMs) &&
    event.durationMs >= 0
  ) {
    out.durationMs = event.durationMs;
  }
  if (tokenUsage !== undefined) {
    out.tokenUsage = tokenUsage;
  }
  if (error !== undefined) {
    out.error = error;
  }
  if (inputPreview !== undefined) {
    out.inputSummary = inputPreview;
  }
  if (outputPreview !== undefined) {
    out.outputSummary = outputPreview;
  }

  return out;
}

/**
 * Maps in-memory {@link InspectEvent} rows to persisted v0.2 events.
 */
export function inspectEventsToPersistedInspectEvents(
  events: readonly InspectEvent[],
  options?: Omit<InspectEventToPersistedOptions, "eventIndex">,
): PersistedInspectEvent[] {
  return events.map((event, index) =>
    inspectEventToPersistedInspectEvent(event, { ...options, eventIndex: index }),
  );
}
