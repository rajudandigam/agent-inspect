import { Redactor } from "./logs/redactor.js";
import {
  applyProfileMetadataCaps,
  resolveRedactionProfile,
  type ResolvedRedactionProfile,
} from "./redaction-profiles.js";
import { serializeEvent } from "./storage.js";
import type { RedactionRule } from "./types/log-config.js";
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
  for (const [k, v] of Object.entries(record)) {
    out[k] = boundMetadataValue(k, v, opts, seen, depth + 1);
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
    const redacted = redactMetadata(metadata as Record<string, unknown>, opts);
    const seen = new WeakSet<object>();
    const bounded = boundMetadataValue(
      "metadata",
      redacted,
      opts,
      seen,
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
