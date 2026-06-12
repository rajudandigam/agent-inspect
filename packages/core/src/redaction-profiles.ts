import type { RedactionProfile } from "./types.js";

/** Extra keys redacted under the `share` profile (in addition to {@link DEFAULT_REDACT_KEYS}). */
export const SHARE_PROFILE_EXTRA_KEYS = [
  "userEmail",
  "customerEmail",
  "phone",
  "phoneNumber",
  "address",
  "ip",
  "ipAddress",
  "sessionId",
  "requestId",
  "correlationId",
  "decisionId",
  "groupId",
  "customerId",
  "userId",
  "accountId",
  "tenantId",
  "orgId",
  "organizationId",
  "traceId",
  "spanId",
  "parentSpanId",
] as const;

/** Extra keys redacted under the `strict` profile (in addition to share keys). */
export const STRICT_PROFILE_EXTRA_KEYS = [
  "prompt",
  "completion",
  "input",
  "output",
  "inputPreview",
  "outputPreview",
  "message",
  "messages",
  "transcript",
  "context",
  "document",
  "documents",
  "chunk",
  "chunks",
  "retrieval",
  "query",
] as const;

export interface ResolvedRedactionProfile {
  profile: RedactionProfile;
  extraKeys: readonly string[];
  maxMetadataValueLengthCap?: number;
  maxPreviewLengthCap?: number;
}

/** Resolves named profile behavior (keys + metadata string caps). */
export function resolveRedactionProfile(
  profile: RedactionProfile = "local",
): ResolvedRedactionProfile {
  switch (profile) {
    case "local":
      return { profile: "local", extraKeys: [] };
    case "share":
      return {
        profile: "share",
        extraKeys: SHARE_PROFILE_EXTRA_KEYS,
        maxMetadataValueLengthCap: 500,
        maxPreviewLengthCap: 200,
      };
    case "strict":
      return {
        profile: "strict",
        extraKeys: [...SHARE_PROFILE_EXTRA_KEYS, ...STRICT_PROFILE_EXTRA_KEYS],
        maxMetadataValueLengthCap: 200,
        maxPreviewLengthCap: 80,
      };
    default:
      return { profile: "local", extraKeys: [] };
  }
}

function isPreviewKey(key: string): boolean {
  return key.toLowerCase().includes("preview");
}

/**
 * Applies profile metadata string caps. User-provided lower limits are preserved.
 */
export function applyProfileMetadataCaps(
  maxMetadataValueLength: number,
  maxPreviewLength: number,
  resolved: ResolvedRedactionProfile,
): { maxMetadataValueLength: number; maxPreviewLength: number } {
  let meta = maxMetadataValueLength;
  let preview = maxPreviewLength;

  if (resolved.maxMetadataValueLengthCap !== undefined) {
    meta = Math.min(meta, resolved.maxMetadataValueLengthCap);
  }
  if (resolved.maxPreviewLengthCap !== undefined) {
    preview = Math.min(preview, resolved.maxPreviewLengthCap);
  }

  return { maxMetadataValueLength: meta, maxPreviewLength: preview };
}

export function truncateStringForProfile(
  value: string,
  key: string,
  maxMetadataValueLength: number,
  maxPreviewLength: number,
): string {
  const max = isPreviewKey(key) ? maxPreviewLength : maxMetadataValueLength;
  if (max <= 0) return "…";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}
