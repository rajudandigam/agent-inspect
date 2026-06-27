import { Redactor } from "./logs/redactor.js";
import {
  applyProfileMetadataCaps,
  resolveRedactionProfile,
  type ResolvedRedactionProfile,
} from "./redaction-profiles.js";
import { serializeEvent } from "./storage.js";
import type { RedactionRule } from "./types/log-config.js";
import {
  isPersistedInspectEvent,
  type PersistedInspectError,
  type PersistedInspectEvent,
  type PersistedTokenUsage,
  type PersistedTraceContext,
} from "./types/persisted-inspect-event.js";
import type {
  InspectRunOptions,
  RedactionProfile,
  StepMetadata,
  TraceEvent,
} from "./types.js";

/** Default max length for string metadata values (non-preview keys). */
export const DEFAULT_MAX_METADATA_VALUE_LENGTH = 2000;

/** Default max length for preview-like metadata keys (contains `preview`, case-insensitive). */
export const DEFAULT_MAX_PREVIEW_LENGTH = 500;

/** Default max serialized JSONL line size in bytes (UTF-8). */
export const DEFAULT_MAX_EVENT_BYTES = 65_536;

/** Resolved trace safety settings used at write time. */
export interface TraceSafetyOptions {
  redactEnabled: boolean;
  redactionRules?: RedactionRule[];
  redactionProfile: RedactionProfile;
  profileExtraKeys: readonly string[];
  maxMetadataValueLength: number;
  maxPreviewLength: number;
  maxEventBytes: number;
}

export type { ResolvedRedactionProfile };
export { resolveRedactionProfile };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const KNOWN_PERSISTED_EVENT_FIELDS = new Set([
  "schemaVersion",
  "eventId",
  "runId",
  "kind",
  "name",
  "parentId",
  "status",
  "timestamp",
  "startedAt",
  "endedAt",
  "durationMs",
  "confidence",
  "source",
  "attributes",
  "inputSummary",
  "outputSummary",
  "error",
  "tokenUsage",
  "trace",
]);

function isSafeExtensionFieldName(key: string): boolean {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}

function isPreviewKey(key: string): boolean {
  return key.toLowerCase().includes("preview");
}

function truncateString(value: string, maxLen: number): string {
  if (maxLen <= 0) return "…";
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}…`;
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/** Resolves {@link InspectRunOptions} trace safety fields with safe defaults. */
export function resolveTraceSafetyOptions(
  options?: Pick<
    InspectRunOptions,
    | "redact"
    | "redactionProfile"
    | "maxEventBytes"
    | "maxMetadataValueLength"
    | "maxPreviewLength"
  >,
): TraceSafetyOptions {
  const redact = options?.redact;
  let redactEnabled = true;
  let redactionRules: RedactionRule[] | undefined;

  if (redact === false) {
    redactEnabled = false;
  } else if (redact === true || redact === undefined) {
    redactEnabled = true;
  } else if (isRecord(redact)) {
    redactEnabled = true;
    redactionRules = redact.rules;
  }

  const profile = options?.redactionProfile ?? "local";
  const resolvedProfile = resolveRedactionProfile(profile);

  const userMaxMetadata =
    typeof options?.maxMetadataValueLength === "number" &&
    Number.isFinite(options.maxMetadataValueLength) &&
    options.maxMetadataValueLength >= 0
      ? Math.floor(options.maxMetadataValueLength)
      : undefined;
  const userMaxPreview =
    typeof options?.maxPreviewLength === "number" &&
    Number.isFinite(options.maxPreviewLength) &&
    options.maxPreviewLength >= 0
      ? Math.floor(options.maxPreviewLength)
      : undefined;

  let maxMetadataValueLength = userMaxMetadata ?? DEFAULT_MAX_METADATA_VALUE_LENGTH;
  let maxPreviewLength = userMaxPreview ?? DEFAULT_MAX_PREVIEW_LENGTH;

  if (redactEnabled && profile !== "local") {
    const capped = applyProfileMetadataCaps(
      maxMetadataValueLength,
      maxPreviewLength,
      resolvedProfile,
    );
    maxMetadataValueLength = capped.maxMetadataValueLength;
    maxPreviewLength = capped.maxPreviewLength;
  }

  return {
    redactEnabled,
    redactionRules,
    redactionProfile: profile,
    profileExtraKeys: redactEnabled ? resolvedProfile.extraKeys : [],
    maxMetadataValueLength,
    maxPreviewLength,
    maxEventBytes:
      typeof options?.maxEventBytes === "number" &&
      Number.isFinite(options.maxEventBytes) &&
      options.maxEventBytes > 0
        ? Math.floor(options.maxEventBytes)
        : DEFAULT_MAX_EVENT_BYTES,
  };
}

function boundMetadataValue(
  key: string,
  value: unknown,
  opts: TraceSafetyOptions,
  seen: WeakSet<object>,
  depth: number,
): unknown {
  if (depth > 32) return "[MaxDepth]";

  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }
  if (typeof value === "function") {
    return "[Function]";
  }
  if (typeof value === "symbol") {
    return "[Symbol]";
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value);
  }
  if (value === undefined) {
    return null;
  }

  if (value === null || typeof value !== "object") {
    if (typeof value === "string") {
      const max = isPreviewKey(key) ? opts.maxPreviewLength : opts.maxMetadataValueLength;
      return truncateString(value, max);
    }
    return value;
  }

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const maxItems = 50;
    const out = value
      .slice(0, maxItems)
      .map((item, index) =>
        boundMetadataValue(String(index), item, opts, seen, depth + 1),
      );
    if (value.length > maxItems) {
      out.push(`…(+${value.length - maxItems} more)`);
    }
    return out;
  }

  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  try {
    for (const [k, v] of Object.entries(record)) {
      out[k] = boundMetadataValue(k, v, opts, seen, depth + 1);
    }
  } catch {
    return { truncated: true, reason: "metadataEnumerationFailed" };
  }
  return out;
}

function redactMetadata(
  metadata: Record<string, unknown>,
  opts: TraceSafetyOptions,
): Record<string, unknown> {
  if (!opts.redactEnabled) return { ...metadata };
  const redactor = new Redactor({
    rules: opts.redactionRules,
    extraKeys: opts.profileExtraKeys,
  });
  return redactor.redactRecord(metadata);
}

/** Redacts (when enabled) and truncates metadata values for disk persistence. */
export function prepareMetadataForDisk(
  metadata: Record<string, unknown> | StepMetadata,
  opts: TraceSafetyOptions,
): Record<string, unknown> {
  try {
    const preBounded = boundMetadataValue(
      "metadata",
      metadata,
      opts,
      new WeakSet<object>(),
      0,
    );
    const redacted = redactMetadata(
      isRecord(preBounded) ? preBounded : {},
      opts,
    );
    const bounded = boundMetadataValue(
      "metadata",
      redacted,
      opts,
      new WeakSet<object>(),
      0,
    );
    return isRecord(bounded) ? bounded : {};
  } catch {
    return { truncated: true, reason: "metadataPreparationFailed" };
  }
}

function truncateErrorStack(
  event: TraceEvent,
  maxLen: number,
): TraceEvent {
  if (event.event !== "run_completed" && event.event !== "step_completed") {
    return event;
  }
  if (!event.error?.stack || typeof event.error.stack !== "string") {
    return event;
  }
  return {
    ...event,
    error: {
      ...event.error,
      stack: truncateString(event.error.stack, maxLen),
    },
  };
}

function replaceMetadataWithTruncationMarker(
  event: TraceEvent,
  originalApproxBytes: number,
): TraceEvent {
  const marker = {
    truncated: true,
    reason: "maxEventBytes",
    originalApproxBytes,
  };
  if (event.event === "run_started") {
    return { ...event, metadata: marker };
  }
  if (event.event === "step_started") {
    return { ...event, metadata: marker };
  }
  return event;
}

function shrinkMetadataLimits(
  opts: TraceSafetyOptions,
  factor: number,
): TraceSafetyOptions {
  return {
    ...opts,
    maxMetadataValueLength: Math.max(32, Math.floor(opts.maxMetadataValueLength * factor)),
    maxPreviewLength: Math.max(16, Math.floor(opts.maxPreviewLength * factor)),
  };
}

function applyMetadataToEvent(
  event: TraceEvent,
  metadata: Record<string, unknown>,
): TraceEvent {
  if (event.event === "run_started") {
    return { ...event, metadata };
  }
  if (event.event === "step_started") {
    return { ...event, metadata: metadata as StepMetadata };
  }
  return event;
}

function eventHasMetadata(event: TraceEvent): boolean {
  return (
    (event.event === "run_started" || event.event === "step_started") &&
    event.metadata !== undefined
  );
}

function getEventMetadata(event: TraceEvent): Record<string, unknown> | undefined {
  if (event.event === "run_started" || event.event === "step_started") {
    return event.metadata as Record<string, unknown> | undefined;
  }
  return undefined;
}

/**
 * Applies redaction, metadata truncation, and final serialized size bounds.
 * Never throws; returns a schema-valid event or a minimally truncated variant.
 */
export function prepareTraceEventForDisk(
  event: TraceEvent,
  opts: TraceSafetyOptions,
): TraceEvent {
  try {
    let working: TraceEvent = { ...event };

    const rawMetadata = getEventMetadata(working);
    if (rawMetadata !== undefined) {
      const safe = prepareMetadataForDisk(rawMetadata, opts);
      working = applyMetadataToEvent(working, safe);
    }

    let serialized = serializeEvent(working);
    if (serialized === "") {
      return working;
    }

    let bytes = byteLength(serialized);
    if (bytes <= opts.maxEventBytes) {
      return working;
    }

    if (rawMetadata !== undefined) {
      for (const factor of [0.5, 0.25, 0.1]) {
        const tighter = shrinkMetadataLimits(opts, factor);
        const shrunk = prepareMetadataForDisk(rawMetadata, tighter);
        working = applyMetadataToEvent(working, shrunk);
        serialized = serializeEvent(working);
        if (serialized !== "" && byteLength(serialized) <= opts.maxEventBytes) {
          return working;
        }
      }

      working = replaceMetadataWithTruncationMarker(working, bytes);
      serialized = serializeEvent(working);
      if (serialized !== "" && byteLength(serialized) <= opts.maxEventBytes) {
        return working;
      }
    }

    working = truncateErrorStack(working, Math.min(opts.maxMetadataValueLength, 500));
    serialized = serializeEvent(working);
    if (serialized !== "" && byteLength(serialized) <= opts.maxEventBytes) {
      return working;
    }

    if (eventHasMetadata(working)) {
      working = replaceMetadataWithTruncationMarker(working, bytes);
      serialized = serializeEvent(working);
      if (serialized !== "" && byteLength(serialized) <= opts.maxEventBytes) {
        return working;
      }

      if (working.event === "run_started") {
        const { metadata: _meta, ...rest } = working;
        working = rest;
      } else if (working.event === "step_started") {
        const { metadata: _meta, ...rest } = working;
        working = rest;
      }
    }

    return working;
  } catch {
    if (event.event === "run_started" || event.event === "step_started") {
      return applyMetadataToEvent(event, {
        truncated: true,
        reason: "prepareTraceEventFailed",
      });
    }
    return event;
  }
}

function safeGet(record: Record<string, unknown>, key: string): unknown {
  try {
    return record[key];
  } catch {
    return undefined;
  }
}

function optionalBoundedString(
  value: unknown,
  _key: string,
  opts: TraceSafetyOptions,
): string | undefined {
  if (typeof value !== "string") return undefined;
  return truncateString(value, opts.maxMetadataValueLength);
}

function requiredBoundedString(
  value: unknown,
  key: string,
  opts: TraceSafetyOptions,
): string | undefined {
  const out = optionalBoundedString(value, key, opts);
  return out && out.length > 0 ? out : undefined;
}

function preparePersistedSummaryForDisk(
  key: "input" | "output",
  value: unknown,
  opts: TraceSafetyOptions,
): unknown {
  try {
    const redactor = new Redactor({
      rules: opts.redactionRules,
      extraKeys: opts.profileExtraKeys,
    });
    const redacted = opts.redactEnabled ? redactor.redactValue(key, value) : value;
    return boundMetadataValue(key, redacted, opts, new WeakSet<object>(), 0);
  } catch {
    return { truncated: true, reason: "summaryPreparationFailed" };
  }
}

function preparePersistedErrorForDisk(
  value: unknown,
  opts: TraceSafetyOptions,
): PersistedInspectError | undefined {
  if (!isRecord(value)) return undefined;

  try {
    const redactor = new Redactor({
      rules: opts.redactionRules,
      extraKeys: opts.profileExtraKeys,
    });
    const rawMessage = safeGet(value, "message");
    const redactedMessage = opts.redactEnabled
      ? redactor.redactValue("message", rawMessage)
      : rawMessage;
    const boundedMessage = boundMetadataValue(
      "message",
      redactedMessage,
      opts,
      new WeakSet<object>(),
      0,
    );
    const message =
      typeof boundedMessage === "string" && boundedMessage.length > 0
        ? boundedMessage
        : "Unknown error";

    const out: PersistedInspectError = { message };
    const name = optionalBoundedString(safeGet(value, "name"), "name", opts);
    const code = optionalBoundedString(safeGet(value, "code"), "code", opts);
    if (name !== undefined) out.name = name;
    if (code !== undefined) out.code = code;
    return out;
  } catch {
    return { message: "Error preparation failed" };
  }
}

function prepareTokenUsage(value: unknown): PersistedTokenUsage | undefined {
  if (!isRecord(value)) return undefined;
  const out: PersistedTokenUsage = {};
  for (const key of ["input", "output", "total", "cached"] as const) {
    const item = safeGet(value, key);
    if (typeof item === "number" && Number.isFinite(item) && item >= 0) {
      out[key] = item;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function prepareTraceContext(
  value: unknown,
  opts: TraceSafetyOptions,
): PersistedTraceContext | undefined {
  if (!isRecord(value)) return undefined;
  const out: PersistedTraceContext = {};
  const traceId = optionalBoundedString(safeGet(value, "traceId"), "traceId", opts);
  const spanId = optionalBoundedString(safeGet(value, "spanId"), "spanId", opts);
  const parentSpanId = optionalBoundedString(
    safeGet(value, "parentSpanId"),
    "parentSpanId",
    opts,
  );
  if (traceId !== undefined) out.traceId = traceId;
  if (spanId !== undefined) out.spanId = spanId;
  if (parentSpanId !== undefined) out.parentSpanId = parentSpanId;
  return Object.keys(out).length > 0 ? out : undefined;
}

function preparePersistedExtensionFieldForDisk(
  key: string,
  value: unknown,
  opts: TraceSafetyOptions,
): unknown {
  if (isRecord(value)) {
    return prepareMetadataForDisk(value, opts);
  }

  const prepared = prepareMetadataForDisk({ [key]: value }, opts);
  return Object.prototype.hasOwnProperty.call(prepared, key)
    ? prepared[key]
    : undefined;
}

function preserveV10ExtensionFields(
  source: Record<string, unknown>,
  candidate: PersistedInspectEvent,
  opts: TraceSafetyOptions,
): void {
  if (candidate.schemaVersion !== "1.0") return;

  for (const [key, value] of Object.entries(source)) {
    if (
      KNOWN_PERSISTED_EVENT_FIELDS.has(key) ||
      !isSafeExtensionFieldName(key)
    ) {
      continue;
    }

    const prepared = preparePersistedExtensionFieldForDisk(key, value, opts);
    if (prepared !== undefined) {
      candidate[key] = prepared;
    }
  }
}

function serializedPersistedEvent(event: PersistedInspectEvent): string | undefined {
  try {
    return JSON.stringify(event);
  } catch {
    return undefined;
  }
}

function persistedEventByteLength(event: PersistedInspectEvent): number | undefined {
  const serialized = serializedPersistedEvent(event);
  return serialized === undefined ? undefined : byteLength(serialized);
}

function minimalPersistedEvent(
  event: PersistedInspectEvent,
  opts: TraceSafetyOptions,
  originalApproxBytes: number,
): PersistedInspectEvent {
  return {
    schemaVersion: event.schemaVersion,
    eventId: truncateString(event.eventId, 128),
    runId: truncateString(event.runId, 128),
    kind: event.kind,
    name: truncateString(event.name, 128),
    ...(event.status !== undefined ? { status: event.status } : {}),
    timestamp: truncateString(event.timestamp, 128),
    confidence: event.confidence,
    source: {
      type: event.source.type,
      ...(event.source.name !== undefined
        ? { name: truncateString(event.source.name, 128) }
        : {}),
      ...(event.source.version !== undefined
        ? { version: truncateString(event.source.version, 128) }
        : {}),
    },
    attributes: {
      truncated: true,
      reason: "maxEventBytes",
      originalApproxBytes,
      maxEventBytes: opts.maxEventBytes,
    },
  };
}

function tinyPersistedEvent(event: PersistedInspectEvent): PersistedInspectEvent {
  return {
    schemaVersion: event.schemaVersion,
    eventId: truncateString(event.eventId, 32),
    runId: truncateString(event.runId, 32),
    kind: event.kind,
    name: truncateString(event.name, 32),
    timestamp: truncateString(event.timestamp, 32),
    confidence: event.confidence,
    source: { type: event.source.type },
    attributes: { truncated: true, reason: "maxEventBytes" },
  };
}

function enforcePersistedEventSize(
  event: PersistedInspectEvent,
  opts: TraceSafetyOptions,
): PersistedInspectEvent | undefined {
  const bytes = persistedEventByteLength(event);
  if (bytes === undefined) return undefined;
  if (bytes <= opts.maxEventBytes) return event;

  const minimal = minimalPersistedEvent(event, opts, bytes);
  const minimalBytes = persistedEventByteLength(minimal);
  if (minimalBytes !== undefined && minimalBytes <= opts.maxEventBytes) {
    return minimal;
  }

  const tiny = tinyPersistedEvent(event);
  return isPersistedInspectEvent(tiny) ? tiny : undefined;
}

/**
 * Prepares persisted inspect events for built-in persistence.
 *
 * The helper is intentionally non-throwing: invalid required fields return
 * `undefined`; supported optional fields are redacted, bounded, JSON-safe, and
 * final serialized-size checked before a writer sees the event.
 */
export function preparePersistedInspectEventForWrite(
  value: unknown,
  opts: TraceSafetyOptions = resolveTraceSafetyOptions(),
): PersistedInspectEvent | undefined {
  try {
    if (!isRecord(value)) return undefined;

    const source = safeGet(value, "source");
    if (!isRecord(source)) return undefined;

    const candidate: PersistedInspectEvent = {
      schemaVersion: safeGet(value, "schemaVersion") as PersistedInspectEvent["schemaVersion"],
      eventId: requiredBoundedString(safeGet(value, "eventId"), "eventId", opts) ?? "",
      runId: requiredBoundedString(safeGet(value, "runId"), "runId", opts) ?? "",
      kind: safeGet(value, "kind") as PersistedInspectEvent["kind"],
      name: requiredBoundedString(safeGet(value, "name"), "name", opts) ?? "",
      timestamp: requiredBoundedString(safeGet(value, "timestamp"), "timestamp", opts) ?? "",
      confidence: safeGet(value, "confidence") as PersistedInspectEvent["confidence"],
      source: {
        type: safeGet(source, "type") as PersistedInspectEvent["source"]["type"],
      },
    };

    const parentId = requiredBoundedString(safeGet(value, "parentId"), "parentId", opts);
    const status = safeGet(value, "status");
    const startedAt = optionalBoundedString(safeGet(value, "startedAt"), "startedAt", opts);
    const endedAt = optionalBoundedString(safeGet(value, "endedAt"), "endedAt", opts);
    const durationMs = safeGet(value, "durationMs");
    const sourceName = optionalBoundedString(safeGet(source, "name"), "name", opts);
    const sourceVersion = optionalBoundedString(safeGet(source, "version"), "version", opts);

    if (parentId !== undefined) candidate.parentId = parentId;
    if (
      status === "running" ||
      status === "ok" ||
      status === "error" ||
      status === "unknown"
    ) {
      candidate.status = status;
    }
    if (startedAt !== undefined) candidate.startedAt = startedAt;
    if (endedAt !== undefined) candidate.endedAt = endedAt;
    if (
      typeof durationMs === "number" &&
      Number.isFinite(durationMs) &&
      durationMs >= 0
    ) {
      candidate.durationMs = durationMs;
    }
    if (sourceName !== undefined) candidate.source.name = sourceName;
    if (sourceVersion !== undefined) candidate.source.version = sourceVersion;

    const attributes = safeGet(value, "attributes");
    if (isRecord(attributes)) {
      candidate.attributes = prepareMetadataForDisk(attributes, opts);
    }

    if (safeGet(value, "inputSummary") !== undefined) {
      candidate.inputSummary = preparePersistedSummaryForDisk(
        "input",
        safeGet(value, "inputSummary"),
        opts,
      );
    }
    if (safeGet(value, "outputSummary") !== undefined) {
      candidate.outputSummary = preparePersistedSummaryForDisk(
        "output",
        safeGet(value, "outputSummary"),
        opts,
      );
    }

    const error = preparePersistedErrorForDisk(safeGet(value, "error"), opts);
    if (error !== undefined) candidate.error = error;

    const tokenUsage = prepareTokenUsage(safeGet(value, "tokenUsage"));
    if (tokenUsage !== undefined) candidate.tokenUsage = tokenUsage;

    const trace = prepareTraceContext(safeGet(value, "trace"), opts);
    if (trace !== undefined) candidate.trace = trace;

    preserveV10ExtensionFields(value, candidate, opts);

    if (!isPersistedInspectEvent(candidate)) return undefined;
    return enforcePersistedEventSize(candidate, opts);
  } catch {
    return undefined;
  }
}
