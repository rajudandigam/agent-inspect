import { extractCorrelationMetadata } from "../correlation-metadata.js";
import type { InspectKind } from "../types/inspect-event.js";
import type {
  ErrorInfo,
  StepMetadata,
  StepType,
  TraceEvent,
} from "../types.js";
import type {
  PersistedEventSource,
  PersistedEventStatus,
  PersistedInspectError,
  PersistedInspectEvent,
  PersistedTokenUsage,
} from "../types/persisted-inspect-event.js";
import { normalizeTokenUsage } from "./token-usage.js";

export interface TraceEventToPersistedOptions {
  /**
   * Stable index within the source event list.
   * Used only to make synthetic eventId deterministic when v0.1 has no eventId.
   */
  eventIndex?: number;

  /**
   * Optional source name override.
   * Default: "trace-event"
   */
  sourceName?: string;

  /**
   * Optional source version override.
   * Default: "0.1"
   */
  sourceVersion?: string;
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function nodeIdForEvent(event: TraceEvent): string {
  switch (event.event) {
    case "run_started":
    case "run_completed":
      return event.runId;
    case "step_started":
    case "step_completed":
      return event.stepId;
    default:
      return "unknown";
  }
}

function createPersistedEventId(event: TraceEvent, eventIndex: number): string {
  const runId = sanitizeIdPart(event.runId);
  const ev = sanitizeIdPart(event.event);
  const node = sanitizeIdPart(nodeIdForEvent(event));
  return `manual:${runId}:${ev}:${node}:${eventIndex}`;
}

function toIsoTimestamp(
  ms: number,
): { iso: string; invalidTimestamp: boolean } {
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    return { iso: new Date(0).toISOString(), invalidTimestamp: true };
  }
  return { iso: new Date(ms).toISOString(), invalidTimestamp: false };
}

function buildSource(options?: TraceEventToPersistedOptions): PersistedEventSource {
  return {
    type: "manual",
    name: options?.sourceName ?? "trace-event",
    version: options?.sourceVersion ?? "0.1",
  };
}

function mapStepTypeToInspectKind(type: StepType): InspectKind {
  switch (type) {
    case "run":
      return "RUN";
    case "llm":
      return "LLM";
    case "tool":
      return "TOOL";
    case "decision":
      return "DECISION";
    case "logic":
    case "state":
    case "custom":
      return "LOGIC";
    default:
      return "LOGIC";
  }
}

function mapRunOrStepStatus(
  status: "success" | "error",
): PersistedEventStatus {
  return status === "success" ? "ok" : "error";
}

function mapErrorInfo(
  error: ErrorInfo | undefined,
): {
  persisted?: PersistedInspectError;
  errorStack?: string;
} {
  if (!error?.message) {
    return {};
  }
  const out: {
    persisted: PersistedInspectError;
    errorStack?: string;
  } = {
    persisted: {
      message: error.message,
      name: "Error",
    },
  };
  if (typeof error.stack === "string" && error.stack.length > 0) {
    out.errorStack = error.stack;
  }
  return out;
}

function mapTokenUsageFromMetadata(
  metadata: StepMetadata | undefined,
): PersistedTokenUsage | undefined {
  return normalizeTokenUsage(metadata?.tokens);
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

/**
 * Maps one v0.1 {@link TraceEvent} to a v0.2 {@link PersistedInspectEvent}.
 * Does not mutate `event`.
 */
export function traceEventToPersistedInspectEvent(
  event: TraceEvent,
  options?: TraceEventToPersistedOptions,
): PersistedInspectEvent {
  const eventIndex = options?.eventIndex ?? 0;
  const eventId = createPersistedEventId(event, eventIndex);
  const source = buildSource(options);
  const tsMain = toIsoTimestamp(event.timestamp);

  switch (event.event) {
    case "run_started": {
      const tsStart = toIsoTimestamp(event.startTime);
      const correlation = extractCorrelationMetadata(event.metadata);
      const attributes = compactAttributes({
        legacyEvent: "run_started",
        metadata:
          event.metadata !== undefined ? { ...event.metadata } : undefined,
        correlationId: correlation?.correlationId,
        requestId: correlation?.requestId,
        decisionId: correlation?.decisionId,
        groupId: correlation?.groupId,
        invalidTimestamp:
          tsMain.invalidTimestamp || tsStart.invalidTimestamp ? true : undefined,
      });

      return {
        schemaVersion: "0.2",
        eventId,
        runId: event.runId,
        kind: "RUN",
        name: event.name,
        status: "running",
        timestamp: tsMain.iso,
        startedAt: tsStart.iso,
        confidence: "explicit",
        source,
        attributes,
      };
    }

    case "run_completed": {
      const tsEnd = toIsoTimestamp(event.endTime);
      const { persisted: error, errorStack } = mapErrorInfo(event.error);
      const attributes = compactAttributes({
        legacyEvent: "run_completed",
        errorStack,
        invalidTimestamp:
          tsMain.invalidTimestamp || tsEnd.invalidTimestamp ? true : undefined,
      });

      return {
        schemaVersion: "0.2",
        eventId,
        runId: event.runId,
        kind: "RUN",
        name: "run",
        status: mapRunOrStepStatus(event.status),
        timestamp: tsMain.iso,
        endedAt: tsEnd.iso,
        durationMs: event.durationMs,
        confidence: "explicit",
        source,
        attributes,
        error,
      };
    }

    case "step_started": {
      const tsStart = toIsoTimestamp(event.startTime);
      const tokenUsage = mapTokenUsageFromMetadata(event.metadata);
      const attributes = compactAttributes({
        legacyEvent: "step_started",
        stepId: event.stepId,
        stepType: event.type,
        metadata:
          event.metadata !== undefined ? { ...event.metadata } : undefined,
        invalidTimestamp:
          tsMain.invalidTimestamp || tsStart.invalidTimestamp ? true : undefined,
      });

      const out: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId,
        runId: event.runId,
        kind: mapStepTypeToInspectKind(event.type),
        name: event.name,
        status: "running",
        timestamp: tsMain.iso,
        startedAt: tsStart.iso,
        confidence: "explicit",
        source,
        attributes,
      };
      if (event.parentId !== undefined) {
        out.parentId = event.parentId;
      }
      if (tokenUsage !== undefined) {
        out.tokenUsage = tokenUsage;
      }
      return out;
    }

    case "step_completed": {
      const tsEnd = toIsoTimestamp(event.endTime);
      const { persisted: error, errorStack } = mapErrorInfo(event.error);
      const attributes = compactAttributes({
        legacyEvent: "step_completed",
        stepId: event.stepId,
        errorStack,
        invalidTimestamp:
          tsMain.invalidTimestamp || tsEnd.invalidTimestamp ? true : undefined,
      });

      return {
        schemaVersion: "0.2",
        eventId,
        runId: event.runId,
        kind: "LOGIC",
        name: event.stepId,
        status: mapRunOrStepStatus(event.status),
        timestamp: tsMain.iso,
        endedAt: tsEnd.iso,
        durationMs: event.durationMs,
        confidence: "explicit",
        source,
        attributes,
        error,
      };
    }

    default: {
      const _exhaustive: never = event;
      throw new Error(`Unsupported trace event: ${(_exhaustive as TraceEvent).event}`);
    }
  }
}

/**
 * Maps a v0.1 trace event list to persisted v0.2 events (one output per input).
 */
export function traceEventsToPersistedInspectEvents(
  events: readonly TraceEvent[],
  options?: Omit<TraceEventToPersistedOptions, "eventIndex">,
): PersistedInspectEvent[] {
  return events.map((event, index) =>
    traceEventToPersistedInspectEvent(event, { ...options, eventIndex: index }),
  );
}
