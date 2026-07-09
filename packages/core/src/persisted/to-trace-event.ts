import type { InspectKind } from "../types/inspect-event.js";
import type {
  ErrorInfo,
  RunStatus,
  StepMetadata,
  StepStatus,
  StepType,
  TraceEvent,
} from "../types.js";
import {
  isPersistedInspectEvent,
  type PersistedInspectEvent,
  type PersistedTokenUsage,
} from "../types/persisted-inspect-event.js";

export interface PersistedToTraceEventOptions {
  /**
   * Stable index within the source event list.
   * Used for deterministic timestamps when only one instant is known.
   */
  eventIndex?: number;
}

function parseIsoToMs(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapInspectKindToStepType(kind: InspectKind): StepType {
  switch (kind) {
    case "LLM":
      return "llm";
    case "TOOL":
      return "tool";
    case "DECISION":
      return "decision";
    case "RUN":
      return "run";
    default:
      return "logic";
  }
}

function mapPersistedStatusToStepStatus(
  status: PersistedInspectEvent["status"],
): StepStatus | undefined {
  switch (status) {
    case "ok":
      return "success";
    case "error":
      return "error";
    case "running":
      return "running";
    default:
      return undefined;
  }
}

function mapPersistedStatusToRunStatus(
  status: PersistedInspectEvent["status"],
): RunStatus | undefined {
  switch (status) {
    case "ok":
      return "success";
    case "error":
      return "error";
    case "running":
      return "running";
    default:
      return undefined;
  }
}

function mapPersistedError(
  error: PersistedInspectEvent["error"],
  attributes: Record<string, unknown> | undefined,
): ErrorInfo | undefined {
  if (!error?.message) return undefined;
  const out: ErrorInfo = { message: error.message };
  const stack =
    typeof attributes?.errorStack === "string" &&
    attributes.errorStack.length > 0
      ? attributes.errorStack
      : undefined;
  if (stack) {
    out.stack = stack;
  }
  return out;
}

function mapTokenUsageToMetadata(
  tokenUsage: PersistedTokenUsage | undefined,
  attributes: Record<string, unknown> | undefined,
): StepMetadata | undefined {
  const metadata: StepMetadata = {};
  if (attributes?.metadata && typeof attributes.metadata === "object") {
    Object.assign(metadata, attributes.metadata as Record<string, unknown>);
  }
  if (tokenUsage) {
    metadata.tokens = {
      ...(tokenUsage.input !== undefined ? { input: tokenUsage.input } : {}),
      ...(tokenUsage.output !== undefined ? { output: tokenUsage.output } : {}),
      ...(tokenUsage.total !== undefined ? { total: tokenUsage.total } : {}),
      ...(tokenUsage.cached !== undefined ? { cached: tokenUsage.cached } : {}),
    };
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function pickRunMetadata(
  attributes: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!attributes) return undefined;
  const metadata =
    attributes.metadata && typeof attributes.metadata === "object"
      ? { ...(attributes.metadata as Record<string, unknown>) }
      : {};
  for (const key of [
    "correlationId",
    "requestId",
    "decisionId",
    "groupId",
  ] as const) {
    const value = attributes[key];
    if (typeof value === "string" && value.trim() !== "") {
      metadata[key] = value;
    }
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function resolveStepId(event: PersistedInspectEvent): string {
  const attrs = event.attributes;
  if (attrs && typeof attrs.stepId === "string" && attrs.stepId.trim() !== "") {
    return attrs.stepId;
  }
  return event.eventId;
}

function resolveStepType(event: PersistedInspectEvent): StepType {
  const attrs = event.attributes;
  if (attrs && typeof attrs.stepType === "string") {
    const t = attrs.stepType;
    if (
      t === "run" ||
      t === "llm" ||
      t === "tool" ||
      t === "decision" ||
      t === "logic" ||
      t === "state" ||
      t === "custom"
    ) {
      return t;
    }
  }
  return mapInspectKindToStepType(event.kind);
}

function resolveTimes(event: PersistedInspectEvent): {
  timestamp: number;
  startTime: number;
  endTime: number;
} {
  const timestamp = parseIsoToMs(event.timestamp);
  const startTime =
    event.startedAt !== undefined ? parseIsoToMs(event.startedAt) : timestamp;
  let endTime =
    event.endedAt !== undefined ? parseIsoToMs(event.endedAt) : timestamp;
  if (
    event.durationMs !== undefined &&
    Number.isFinite(event.durationMs) &&
    event.durationMs >= 0 &&
    event.endedAt === undefined
  ) {
    endTime = startTime + event.durationMs;
  }
  return { timestamp, startTime, endTime };
}

function fromLegacyRunStarted(event: PersistedInspectEvent): TraceEvent {
  const { timestamp, startTime } = resolveTimes(event);
  const out: Extract<TraceEvent, { event: "run_started" }> = {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp,
    runId: event.runId,
    name: event.name,
    startTime,
  };
  const metadata = pickRunMetadata(event.attributes);
  if (metadata) out.metadata = metadata;
  return out;
}

function fromLegacyRunCompleted(event: PersistedInspectEvent): TraceEvent {
  const { timestamp, endTime } = resolveTimes(event);
  const status = mapPersistedStatusToRunStatus(event.status) ?? "success";
  const out: Extract<TraceEvent, { event: "run_completed" }> = {
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp,
    runId: event.runId,
    status: status === "running" ? "success" : status,
    endTime,
    durationMs: event.durationMs ?? Math.max(0, endTime - timestamp),
  };
  const error = mapPersistedError(event.error, event.attributes);
  if (error) out.error = error;
  return out;
}

function fromLegacyStepStarted(event: PersistedInspectEvent): TraceEvent {
  const { timestamp, startTime } = resolveTimes(event);
  const out: Extract<TraceEvent, { event: "step_started" }> = {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp,
    runId: event.runId,
    stepId: resolveStepId(event),
    name: event.name,
    type: resolveStepType(event),
    startTime,
  };
  if (event.parentId !== undefined) out.parentId = event.parentId;
  const metadata = mapTokenUsageToMetadata(event.tokenUsage, event.attributes);
  if (metadata) out.metadata = metadata;
  return out;
}

function fromLegacyStepCompleted(event: PersistedInspectEvent): TraceEvent {
  const { timestamp, endTime } = resolveTimes(event);
  const status = mapPersistedStatusToStepStatus(event.status) ?? "success";
  const out: Extract<TraceEvent, { event: "step_completed" }> = {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp,
    runId: event.runId,
    stepId: resolveStepId(event),
    status: status === "running" ? "success" : status,
    endTime,
    durationMs: event.durationMs ?? Math.max(0, endTime - timestamp),
  };
  const error = mapPersistedError(event.error, event.attributes);
  if (error) out.error = error;
  return out;
}

function fromLegacyOutcomeObserved(event: PersistedInspectEvent): TraceEvent {
  const attrs = event.attributes ?? {};
  const observedAtRaw = attrs.observedAt;
  const observedAt =
    typeof observedAtRaw === "string"
      ? Date.parse(observedAtRaw)
      : typeof observedAtRaw === "number" && Number.isFinite(observedAtRaw)
        ? observedAtRaw
        : resolveTimes(event).timestamp;
  const status = attrs.outcomeStatus;
  const out: Extract<TraceEvent, { event: "outcome_observed" }> = {
    schemaVersion: "0.1",
    event: "outcome_observed",
    timestamp: observedAt,
    runId: event.runId,
    outcomeId:
      typeof attrs.outcomeId === "string" ? attrs.outcomeId : event.eventId,
    name: event.name,
    expectation:
      typeof attrs.expectation === "string" ? attrs.expectation : event.name,
    status:
      status === "passed" ||
      status === "failed" ||
      status === "unknown" ||
      status === "skipped"
        ? status
        : "unknown",
    observedAt,
  };
  if (event.parentId !== undefined) out.parentId = event.parentId;
  if (typeof attrs.method === "string") out.method = attrs.method as never;
  if (attrs.actual !== undefined) out.actual = attrs.actual;
  if (event.outputSummary !== undefined) out.actual = event.outputSummary;
  if (attrs.evidence !== undefined) out.evidence = attrs.evidence;
  return out;
}

function fromNativeOutcome(event: PersistedInspectEvent): TraceEvent[] {
  return [fromLegacyOutcomeObserved(event)];
}

function fromNativeRun(event: PersistedInspectEvent): TraceEvent[] {
  const { timestamp, startTime, endTime } = resolveTimes(event);
  const runStatus = mapPersistedStatusToRunStatus(event.status);
  const out: TraceEvent[] = [];

  if (runStatus === "running" || event.startedAt !== undefined) {
    const started: Extract<TraceEvent, { event: "run_started" }> = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp,
      runId: event.runId,
      name: event.name,
      startTime,
    };
    const metadata = pickRunMetadata(event.attributes);
    if (metadata) started.metadata = metadata;
    out.push(started);
  }

  if (runStatus === "success" || runStatus === "error" || event.endedAt !== undefined) {
    const completed: Extract<TraceEvent, { event: "run_completed" }> = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp,
      runId: event.runId,
      status: runStatus === "error" ? "error" : "success",
      endTime,
      durationMs: event.durationMs ?? Math.max(0, endTime - startTime),
    };
    const error = mapPersistedError(event.error, event.attributes);
    if (error) completed.error = error;
    out.push(completed);
  }

  if (out.length === 0) {
    out.push(fromLegacyRunStarted(event));
  }

  return out;
}

function fromNativeStep(event: PersistedInspectEvent): TraceEvent[] {
  const { timestamp, startTime, endTime } = resolveTimes(event);
  const stepStatus = mapPersistedStatusToStepStatus(event.status);
  const stepId = resolveStepId(event);
  const out: TraceEvent[] = [];

  const shouldEmitStarted =
    stepStatus === "running" ||
    event.startedAt !== undefined ||
    stepStatus === "success" ||
    stepStatus === "error";

  if (shouldEmitStarted) {
    const started: Extract<TraceEvent, { event: "step_started" }> = {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp,
      runId: event.runId,
      stepId,
      name: event.name,
      type: resolveStepType(event),
      startTime,
    };
    if (event.parentId !== undefined) started.parentId = event.parentId;
    const metadata = mapTokenUsageToMetadata(event.tokenUsage, event.attributes);
    if (metadata) started.metadata = metadata;
    out.push(started);
  }

  if (
    stepStatus === "success" ||
    stepStatus === "error" ||
    event.endedAt !== undefined ||
    event.durationMs !== undefined
  ) {
    const completed: Extract<TraceEvent, { event: "step_completed" }> = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp,
      runId: event.runId,
      stepId,
      status: stepStatus === "error" ? "error" : "success",
      endTime,
      durationMs: event.durationMs ?? Math.max(0, endTime - startTime),
    };
    const error = mapPersistedError(event.error, event.attributes);
    if (error) completed.error = error;
    out.push(completed);
  }

  if (out.length === 0) {
    out.push(fromLegacyStepStarted(event));
  }

  return out;
}

/**
 * Maps one v0.2 {@link PersistedInspectEvent} to zero or more v0.1 {@link TraceEvent} rows
 * for inspection commands. Does not mutate `event`.
 */
export function persistedInspectEventToTraceEvents(
  event: PersistedInspectEvent,
): TraceEvent[] {
  if (!isPersistedInspectEvent(event)) {
    throw new Error("Invalid PersistedInspectEvent: failed isPersistedInspectEvent");
  }

  const legacyEvent = event.attributes?.legacyEvent;
  if (legacyEvent === "run_started") return [fromLegacyRunStarted(event)];
  if (legacyEvent === "run_completed") return [fromLegacyRunCompleted(event)];
  if (legacyEvent === "step_started") return [fromLegacyStepStarted(event)];
  if (legacyEvent === "step_completed") return [fromLegacyStepCompleted(event)];
  if (legacyEvent === "outcome_observed") return [fromLegacyOutcomeObserved(event)];

  if (event.kind === "RUN") {
    return fromNativeRun(event);
  }

  if (event.kind === "OUTCOME") {
    return fromNativeOutcome(event);
  }

  return fromNativeStep(event);
}

/**
 * Maps persisted v0.2 events to v0.1 trace events for inspection.
 */
export function persistedInspectEventsToTraceEvents(
  events: readonly PersistedInspectEvent[],
  options?: PersistedToTraceEventOptions,
): TraceEvent[] {
  const out: TraceEvent[] = [];
  events.forEach((event, index) => {
    const rows = persistedInspectEventToTraceEvents(event);
    if (rows.length === 0 && options?.eventIndex !== undefined) {
      void options.eventIndex;
      void index;
    }
    out.push(...rows);
  });
  return out;
}
