/**
 * Recipe-scoped opaque references for capture.
 * Do not encode a tenant, user, URL, or filesystem path inside these ids.
 */

export type OpaqueTenantRef = string;
export type OpaqueOperationRef = string;
export type OpaqueResultRef = string;

let opSeq = 0;
let resultSeq = 0;

/** Stable opaque tenant refs used as Nest store keys and captured identities. */
export const TENANT_ALPHA = "tref-alpha" as const;
export const TENANT_BETA = "tref-beta" as const;

/** Tokens that must never appear on shareable surfaces under test. */
export const FORBIDDEN_SHARE_TOKENS = [
  "tenant-A",
  "tenant-B",
  "op-tenant-",
  "/tmp/",
  "user@",
] as const;

export function nextOperationRef(): OpaqueOperationRef {
  opSeq += 1;
  return `op-ref-${String(opSeq).padStart(2, "0")}`;
}

export function nextResultRef(): OpaqueResultRef {
  resultSeq += 1;
  return `rref-${String(resultSeq).padStart(2, "0")}`;
}

/**
 * Join meaning from opaque refs only.
 * Identical redacted placeholders are not evidence of equality.
 */
export function classifyOpaqueJoin(input: {
  requestedTenantRef: string | undefined;
  policyTenantRef: string | undefined;
}): "match" | "mismatch" | "unknown" {
  const req = input.requestedTenantRef;
  const pol = input.policyTenantRef;
  if (!req || !pol) return "unknown";
  if (req === "[REDACTED]" || pol === "[REDACTED]") return "unknown";
  if (req.includes("…") || pol.includes("…")) return "unknown";
  return req === pol ? "match" : "mismatch";
}
