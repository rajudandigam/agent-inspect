/** Aggregate verify-safe status for a bundle. */
export type BundleSafeStatus = "SAFE" | "SAFE WITH WARNINGS" | "UNSAFE" | "UNKNOWN";

/** Metadata-safe status (underscore form). */
export type BundleSafeStatusMetadata =
  | "SAFE"
  | "SAFE_WITH_WARNINGS"
  | "UNSAFE"
  | "UNKNOWN";

export type BundleRedactionProfile = "local" | "share" | "strict";

export interface BundleMetadata {
  createdAt: string;
  agentInspectVersion: string;
  redactionProfile: BundleRedactionProfile;
  sourceTraceCount: number;
  runIds: string[];
  safeStatus: BundleSafeStatusMetadata;
  files: string[];
  note: string;
  sessionId?: string;
  since?: string;
}

export interface BundleRedactionReportRun {
  runId: string;
  findings: number;
  detectors: string[];
}

export interface BundleRedactionReport {
  profile: BundleRedactionProfile;
  totalFindings: number;
  runs: BundleRedactionReportRun[];
}

export interface BundleCheckRunResult {
  runId: string;
  status: BundleSafeStatus;
  errors: number;
  warnings: number;
  findings: number;
}

export interface BundleCheckResults {
  aggregateStatus: BundleSafeStatus;
  runs: BundleCheckRunResult[];
}

export interface BundleResolveOptions {
  runId?: string;
  sessionId?: string;
  since?: string;
}

export interface BundleResolveResult {
  runIds: string[];
  sessionId?: string;
  since?: string;
}

export interface BundlePlaceholderArtifact {
  status: "not_requested";
  note: string;
}
