import type { InspectNode, InspectRunTree } from "../types/inspect-event.js";
import { Redactor } from "../logs/redactor.js";
import {
  applyProfileMetadataCaps,
  resolveRedactionProfile,
  truncateStringForProfile,
} from "../redaction-profiles.js";
import type { RedactionProfile } from "../types.js";

export interface RedactRunTreeForExportOptions {
  redactionProfile?: RedactionProfile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepClone(v);
  }
  return out as T;
}

function boundAttributeValues(
  record: Record<string, unknown>,
  maxMetadataValueLength: number,
  maxPreviewLength: number,
  seen: WeakSet<object>,
  depth: number,
): Record<string, unknown> {
  if (depth > 32) {
    return { truncated: true, reason: "maxDepth" };
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = boundValue(value, key, maxMetadataValueLength, maxPreviewLength, seen, depth);
  }
  return out;
}

function boundValue(
  value: unknown,
  key: string,
  maxMetadataValueLength: number,
  maxPreviewLength: number,
  seen: WeakSet<object>,
  depth: number,
): unknown {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") {
      return truncateStringForProfile(
        value,
        key,
        maxMetadataValueLength,
        maxPreviewLength,
      );
    }
    return value;
  }

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item, index) =>
        boundValue(
          item,
          String(index),
          maxMetadataValueLength,
          maxPreviewLength,
          seen,
          depth + 1,
        ),
      );
  }

  return boundAttributeValues(
    value as Record<string, unknown>,
    maxMetadataValueLength,
    maxPreviewLength,
    seen,
    depth + 1,
  );
}

function redactEventAttributes(
  attrs: Record<string, unknown> | undefined,
  redactor: Redactor,
  maxMetadataValueLength: number,
  maxPreviewLength: number,
): Record<string, unknown> | undefined {
  if (!attrs || Object.keys(attrs).length === 0) {
    return attrs;
  }

  const redacted = redactor.redactRecord(attrs);
  const seen = new WeakSet<object>();
  const bounded = boundAttributeValues(
    redacted,
    maxMetadataValueLength,
    maxPreviewLength,
    seen,
    0,
  );

  const err = bounded.error;
  if (isRecord(err) && typeof err.message === "string") {
    bounded.error = {
      ...err,
      message: truncateStringForProfile(
        err.message,
        "message",
        maxMetadataValueLength,
        maxPreviewLength,
      ),
      ...(typeof err.stack === "string"
        ? {
            stack: truncateStringForProfile(
              err.stack,
              "stack",
              maxMetadataValueLength,
              maxPreviewLength,
            ),
          }
        : {}),
    };
  }

  return bounded;
}

/**
 * Returns a deep copy of `tree` with profile-based redaction applied to event attributes.
 * Does not mutate the input tree.
 */
export function redactRunTreeForExport(
  tree: InspectRunTree,
  options?: RedactRunTreeForExportOptions,
): InspectRunTree {
  const profile = options?.redactionProfile ?? "local";
  if (profile === "local") {
    return deepClone(tree);
  }

  const resolved = resolveRedactionProfile(profile);
  const { maxMetadataValueLength, maxPreviewLength } = applyProfileMetadataCaps(
    2000,
    500,
    resolved,
  );
  const redactor = new Redactor({ extraKeys: resolved.extraKeys });

  const clone = deepClone(tree);

  function walk(nodes: InspectNode[]): void {
    for (const node of nodes) {
      if (node.event.attributes !== undefined) {
        node.event.attributes = redactEventAttributes(
          node.event.attributes,
          redactor,
          maxMetadataValueLength,
          maxPreviewLength,
        );
      }
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(clone.children);
  return clone;
}
