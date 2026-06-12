import type { InspectRunOptions, TraceCorrelationMetadata } from "./types.js";

export const TRACE_CORRELATION_KEYS = [
  "correlationId",
  "requestId",
  "decisionId",
  "groupId",
] as const satisfies readonly (keyof TraceCorrelationMetadata)[];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Extracts known correlation keys from a metadata record. */
export function extractCorrelationMetadata(
  record: Record<string, unknown> | undefined,
): TraceCorrelationMetadata | undefined {
  if (!record) {
    return undefined;
  }

  const out: TraceCorrelationMetadata = {};
  let found = false;

  for (const key of TRACE_CORRELATION_KEYS) {
    const value = record[key];
    if (isNonEmptyString(value)) {
      out[key] = value;
      found = true;
    }
  }

  return found ? out : undefined;
}

/**
 * Builds `run_started` metadata from optional run metadata and top-level correlation fields.
 * Top-level correlation options override the same keys in `options.metadata`.
 */
export function buildRunStartedMetadata(
  options?: Pick<
    InspectRunOptions,
    | "metadata"
    | "correlationId"
    | "requestId"
    | "decisionId"
    | "groupId"
  >,
): Record<string, unknown> | undefined {
  if (!options) {
    return undefined;
  }

  const merged: Record<string, unknown> =
    options.metadata !== undefined ? { ...options.metadata } : {};

  if (isNonEmptyString(options.correlationId)) {
    merged.correlationId = options.correlationId;
  }
  if (isNonEmptyString(options.requestId)) {
    merged.requestId = options.requestId;
  }
  if (isNonEmptyString(options.decisionId)) {
    merged.decisionId = options.decisionId;
  }
  if (isNonEmptyString(options.groupId)) {
    merged.groupId = options.groupId;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}
