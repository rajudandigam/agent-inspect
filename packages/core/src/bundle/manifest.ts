import { aggregateBundleSafeStatus, toMetadataSafeStatus } from "./safety-status.js";
import type {
  BundleCheckResults,
  BundleMetadata,
  BundlePlaceholderArtifact,
  BundleRedactionProfile,
  BundleResolveResult,
} from "./types.js";

const BUNDLE_NOTE =
  "Generated locally by AgentInspect. Bundles are derived copies for review — not compliance or security certification. Review before sharing.";

const PLACEHOLDER_NOTE =
  "No eval or performance artifacts were requested for this bundle.";

export function buildBundleMetadata(parts: {
  agentInspectVersion: string;
  profile: BundleRedactionProfile;
  resolve: BundleResolveResult;
  checks: BundleCheckResults;
  files: string[];
  createdAt?: string;
}): BundleMetadata {
  const aggregate = aggregateBundleSafeStatus(
    parts.checks.runs.map((run) => run.status),
  );
  return {
    createdAt: parts.createdAt ?? new Date().toISOString(),
    agentInspectVersion: parts.agentInspectVersion,
    redactionProfile: parts.profile,
    sourceTraceCount: parts.resolve.runIds.length,
    runIds: [...parts.resolve.runIds],
    safeStatus: toMetadataSafeStatus(aggregate),
    files: [...parts.files].sort((a, b) => a.localeCompare(b)),
    note: BUNDLE_NOTE,
    ...(parts.resolve.sessionId !== undefined ? { sessionId: parts.resolve.sessionId } : {}),
    ...(parts.resolve.since !== undefined ? { since: parts.resolve.since } : {}),
  };
}

export function buildPlaceholderArtifact(): BundlePlaceholderArtifact {
  return {
    status: "not_requested",
    note: PLACEHOLDER_NOTE,
  };
}
