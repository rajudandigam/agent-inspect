import type { AttributionConfidence, InspectKind } from "./inspect-event.js";

export type PersistedSchemaVersion = "0.2";

export type PersistedEventSourceType =
  | "manual"
  | "json-log"
  | "log4js"
  | "adapter"
  | "ai-sdk"
  | "otel";

export interface PersistedEventSource {
  type: PersistedEventSourceType;
  name?: string;
  version?: string;
}

export type PersistedEventStatus = "running" | "ok" | "error" | "unknown";

export interface PersistedInspectError {
  name?: string;
  message: string;
  code?: string;
}

export interface PersistedTokenUsage {
  input?: number;
  output?: number;
  total?: number;
}

export interface PersistedTraceContext {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

export interface PersistedInspectEvent {
  schemaVersion: PersistedSchemaVersion;
  eventId: string;
  runId: string;
  parentId?: string;
  kind: InspectKind;
  name: string;
  status?: PersistedEventStatus;
  timestamp: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  confidence: AttributionConfidence;
  source: PersistedEventSource;
  attributes?: Record<string, unknown>;
  inputSummary?: unknown;
  outputSummary?: unknown;
  error?: PersistedInspectError;
  tokenUsage?: PersistedTokenUsage;
  trace?: PersistedTraceContext;
}

const INSPECT_KINDS: readonly InspectKind[] = [
  "RUN",
  "AGENT",
  "LLM",
  "TOOL",
  "CHAIN",
  "RETRIEVER",
  "DECISION",
  "RESULT",
  "ERROR",
  "LOGIC",
  "LOG",
];

const ATTRIBUTION_CONFIDENCES: readonly AttributionConfidence[] = [
  "explicit",
  "correlated",
  "heuristic",
  "unknown",
];

const PERSISTED_EVENT_SOURCE_TYPES: readonly PersistedEventSourceType[] = [
  "manual",
  "json-log",
  "log4js",
  "adapter",
  "ai-sdk",
  "otel",
];

const PERSISTED_EVENT_STATUSES: readonly PersistedEventStatus[] = [
  "running",
  "ok",
  "error",
  "unknown",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isOptionalNonNegativeNumber(value: unknown): boolean {
  return value === undefined || isNonNegativeNumber(value);
}

function isInspectKind(value: unknown): value is InspectKind {
  return (
    typeof value === "string" &&
    (INSPECT_KINDS as readonly string[]).includes(value)
  );
}

function isAttributionConfidence(value: unknown): value is AttributionConfidence {
  return (
    typeof value === "string" &&
    (ATTRIBUTION_CONFIDENCES as readonly string[]).includes(value)
  );
}

function isPersistedEventSourceType(
  value: unknown,
): value is PersistedEventSourceType {
  return (
    typeof value === "string" &&
    (PERSISTED_EVENT_SOURCE_TYPES as readonly string[]).includes(value)
  );
}

function isPersistedEventStatus(value: unknown): value is PersistedEventStatus {
  return (
    typeof value === "string" &&
    (PERSISTED_EVENT_STATUSES as readonly string[]).includes(value)
  );
}

function isPersistedEventSource(value: unknown): value is PersistedEventSource {
  if (!isRecord(value)) return false;
  if (!isPersistedEventSourceType(value.type)) return false;
  if (!isOptionalString(value.name)) return false;
  if (!isOptionalString(value.version)) return false;
  return true;
}

function isPersistedInspectError(value: unknown): value is PersistedInspectError {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.message)) return false;
  if (!isOptionalString(value.name)) return false;
  if (!isOptionalString(value.code)) return false;
  return true;
}

function isPersistedTokenUsage(value: unknown): value is PersistedTokenUsage {
  if (!isRecord(value)) return false;
  if (!isOptionalNonNegativeNumber(value.input)) return false;
  if (!isOptionalNonNegativeNumber(value.output)) return false;
  if (!isOptionalNonNegativeNumber(value.total)) return false;
  return true;
}

function isPersistedTraceContext(value: unknown): value is PersistedTraceContext {
  if (!isRecord(value)) return false;
  if (!isOptionalString(value.traceId)) return false;
  if (!isOptionalString(value.spanId)) return false;
  if (!isOptionalString(value.parentSpanId)) return false;
  return true;
}

/**
 * Runtime guard for a v0.2 {@link PersistedInspectEvent} JSON object.
 *
 * Timestamp fields (`timestamp`, `startedAt`, `endedAt`) are validated as
 * non-empty strings only — stricter ISO-8601 parsing may be added later.
 */
export function isPersistedInspectEvent(
  value: unknown,
): value is PersistedInspectEvent {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== "0.2") return false;

  if (!isNonEmptyString(value.eventId)) return false;
  if (!isNonEmptyString(value.runId)) return false;
  if (!isInspectKind(value.kind)) return false;
  if (!isNonEmptyString(value.name)) return false;
  // Non-empty string required; ISO format not validated in this PR.
  if (!isNonEmptyString(value.timestamp)) return false;
  if (!isAttributionConfidence(value.confidence)) return false;
  if (!isPersistedEventSource(value.source)) return false;

  if (value.parentId !== undefined && !isNonEmptyString(value.parentId)) {
    return false;
  }
  if (value.status !== undefined && !isPersistedEventStatus(value.status)) {
    return false;
  }
  if (!isOptionalString(value.startedAt)) return false;
  if (!isOptionalString(value.endedAt)) return false;
  if (value.durationMs !== undefined && !isNonNegativeNumber(value.durationMs)) {
    return false;
  }
  if (value.attributes !== undefined && !isRecord(value.attributes)) {
    return false;
  }
  if (value.error !== undefined && !isPersistedInspectError(value.error)) {
    return false;
  }
  if (value.tokenUsage !== undefined && !isPersistedTokenUsage(value.tokenUsage)) {
    return false;
  }
  if (value.trace !== undefined && !isPersistedTraceContext(value.trace)) {
    return false;
  }

  return true;
}
