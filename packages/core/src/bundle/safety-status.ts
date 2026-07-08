import type { BundleSafeStatus, BundleSafeStatusMetadata } from "./types.js";

export function aggregateBundleSafeStatus(statuses: readonly BundleSafeStatus[]): BundleSafeStatus {
  if (statuses.length === 0) return "UNKNOWN";
  if (statuses.some((status) => status === "UNSAFE")) return "UNSAFE";
  if (statuses.some((status) => status === "UNKNOWN")) return "UNKNOWN";
  if (statuses.some((status) => status === "SAFE WITH WARNINGS")) return "SAFE WITH WARNINGS";
  return "SAFE";
}

export function toMetadataSafeStatus(status: BundleSafeStatus): BundleSafeStatusMetadata {
  if (status === "SAFE WITH WARNINGS") return "SAFE_WITH_WARNINGS";
  return status;
}

export function bundleFailsOnSafety(
  status: BundleSafeStatus,
  allowUnsafe: boolean,
): boolean {
  if (allowUnsafe) return false;
  return status === "UNSAFE" || status === "UNKNOWN";
}
