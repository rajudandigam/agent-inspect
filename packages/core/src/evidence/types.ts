/** Portable Evidence v2 (`evidenceFormatVersion`) — independent of trace schema. */

export type EvidenceFormatVersion = "1.0";

export type EvidenceSafeStatus = "SAFE" | "SAFE WITH WARNINGS" | "UNSAFE" | "UNKNOWN";

export type EvidenceRedactionProfile = "local" | "share" | "strict";

export type EvidenceVerificationPolicy = "development" | "local" | "share" | "strict";

export type EvidenceFileRole =
  | "report"
  | "redacted-trace"
  | "checks"
  | "contract"
  | "redaction-report"
  | "summary"
  | "other";

/** How a packaged contract/preset was supplied (6.28+). */
export type EvidenceContractBindingSource =
  | "file"
  | "inline"
  | "preset"
  | "cli-shorthand"
  | "programmatic";

/** Reproducibility honesty for contract binding (6.28+). */
export type EvidenceContractBindingStatus = "complete" | "partial" | "unavailable";

/**
 * Optional Evidence v2 contract binding (6.28+).
 * Additive; older readers ignore unknown fields. Not a signature or trusted-time claim.
 */
export interface EvidenceContractBinding {
  status: EvidenceContractBindingStatus;
  source: EvidenceContractBindingSource;
  contractId?: string;
  contractVersion?: string;
  canonicalizationVersion: "1";
  engineVersion: string;
  /** Relative packaged path (typically `contract.resolved.json`). */
  path?: string;
  /** SHA-256 of the packaged resolved-contract bytes. */
  sha256?: string;
  ruleIds: string[];
  unsupportedRuleIds?: string[];
  note?: string;
}

/**
 * Optional fields embedded in `check-results.json` to bind results to a contract digest.
 */
export interface EvidenceCheckContractBinding {
  contractDigest?: string;
  canonicalizationVersion?: "1";
  engineVersion?: string;
  evaluatedRuleIds?: string[];
  bindingStatus?: EvidenceContractBindingStatus;
  unsupportedRuleIds?: string[];
  origin?: {
    source: EvidenceContractBindingSource;
    preset?: string;
    path?: string;
  };
  selectedScope?: Record<string, unknown>;
  selectedAlternativeBranch?: string;
}

export interface EvidenceSourceHash {
  runId: string;
  algorithm: "sha256";
  hash: string;
}

export interface EvidenceFileEntry {
  path: string;
  sha256: string;
  role?: EvidenceFileRole;
}

export interface EvidenceManifest {
  evidenceFormatVersion: EvidenceFormatVersion;
  generator: {
    name: string;
    version: string;
  };
  createdAt?: string;
  source: {
    runIds: string[];
    traceSchemaVersions: string[];
    sourceHashes: EvidenceSourceHash[];
  };
  policy: {
    redactionProfile: EvidenceRedactionProfile;
    verificationPolicy: EvidenceVerificationPolicy;
  };
  assessment: {
    status: EvidenceSafeStatus;
    sourceStatus?: EvidenceSafeStatus;
    note?: string;
  };
  /**
   * Optional TraceFacts / logical-projection summary (6.14+).
   * Additive; older readers ignore unknown fields.
   */
  semantics?: EvidenceSemantics;
  /**
   * Optional resolved-contract binding (6.28+).
   * Additive; older readers ignore unknown fields.
   */
  contract?: EvidenceContractBinding;
  files: EvidenceFileEntry[];
}

/**
 * Bounded semantic summary embedded in Evidence v2 (mirrors check parity summary).
 * Does not embed raw events or prompts.
 */
export interface EvidenceSemantics {
  projectionVersion?: string;
  rawEventCount?: number;
  logicalEventCount?: number;
  runningLogicalCount?: number;
  finishedToolCount?: number;
  finishedToolNames?: string[];
  pairedCount?: number;
  parentRemapCount?: number;
  contractStatus?: "pass" | "fail" | "error";
  /**
   * Bounded derived failure role counts (6.19+). IDs and error bodies omitted.
   *
   * @experimental
   */
  failureRoleCounts?: {
    transient: number;
    recovered: number;
    terminal: number;
    unknown: number;
  };
}

export interface EvidencePackagedFile {
  /** Relative POSIX path inside the evidence/bundle directory. */
  path: string;
  /** Exact bytes that will be / were written. */
  content: string | Uint8Array;
  role?: EvidenceFileRole;
}

export const EVIDENCE_FORMAT_VERSION: EvidenceFormatVersion = "1.0";

export const EVIDENCE_ASSESSMENT_NOTE =
  "Best-effort local safety verification only; not a compliance certification.";

export const EVIDENCE_MANIFEST_FILENAME = "evidence.json";

/** Packaged resolved TraceContract / check-preset snapshot (6.28+). */
export const EVIDENCE_RESOLVED_CONTRACT_FILENAME = "contract.resolved.json";
