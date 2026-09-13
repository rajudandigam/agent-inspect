/**
 * Helpers for CI Evidence v2 packages (same files as share-safe bundles).
 */
import { buildEvidenceHtmlShell } from "./html-shell.js";
import {
  buildEvidenceManifest,
  collectTraceSchemaVersions,
  serializeEvidenceManifest,
} from "./manifest.js";
import { sha256Hex } from "./hash.js";
import {
  EVIDENCE_ASSESSMENT_NOTE,
  EVIDENCE_FORMAT_VERSION,
  EVIDENCE_MANIFEST_FILENAME,
  EVIDENCE_RESOLVED_CONTRACT_FILENAME,
  type EvidenceContractBinding,
  type EvidenceManifest,
  type EvidenceSafeStatus,
} from "./types.js";
import { EVIDENCE_HTML_FILENAME } from "./html-shell.js";
import {
  bindCheckResultsToContract,
  buildEvidenceContractPackage,
  serializeCheckResultsJson,
  type BuildEvidenceContractPackageInput,
} from "./contract-binding.js";

export interface EvidenceCiPackageInput {
  generatorVersion: string;
  runIds: readonly string[];
  /** Pre-redaction source bytes keyed by run id (for sourceHashes). */
  sourceContents: ReadonlyMap<string, string> | Record<string, string>;
  /** Redacted combined JSONL written as trace.jsonl. */
  redactedTraceJsonl: string;
  redactionProfile: "local" | "share" | "strict";
  assessmentStatus: EvidenceSafeStatus;
  sourceStatus?: EvidenceSafeStatus;
  checkResultsJson: string;
  createdAt?: string;
  summaryText?: string;
  /** Optional TraceFacts/parity summary embedded in evidence.json (6.14+). */
  semantics?: EvidenceManifest["semantics"];
  /**
   * Optional TraceContract / preset binding (6.28+).
   * When omitted, no contract section is written (older Evidence shape).
   * Pass `{ engineVersion, source }` with neither contract nor preset to record `unavailable`.
   */
  contractPackage?: BuildEvidenceContractPackageInput;
}

export interface EvidenceCiPackageFiles {
  "evidence.html": string;
  "evidence.json": string;
  "check-results.json": string;
  "trace.jsonl": string;
  "contract.resolved.json"?: string;
  manifest: EvidenceManifest;
}

function asMap(
  value: ReadonlyMap<string, string> | Record<string, string>,
): Map<string, string> {
  if (value instanceof Map) return new Map(value);
  return new Map(Object.entries(value));
}

/**
 * Build the standard CI evidence files (in memory) using Evidence v2 helpers.
 * Optionally packages `contract.resolved.json` and binds digests (6.28+).
 */
export function buildEvidenceCiPackage(input: EvidenceCiPackageInput): EvidenceCiPackageFiles {
  const sources = asMap(input.sourceContents);
  const sourceHashes = input.runIds.map((runId) => ({
    runId,
    algorithm: "sha256" as const,
    hash: sha256Hex(sources.get(runId) ?? ""),
  }));
  const schemaVersions = new Set<string>();
  for (const content of sources.values()) {
    for (const version of collectTraceSchemaVersions(content)) {
      schemaVersions.add(version);
    }
  }
  for (const version of collectTraceSchemaVersions(input.redactedTraceJsonl)) {
    schemaVersions.add(version);
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const evidenceHtml = buildEvidenceHtmlShell({
    title: "AgentInspect evidence",
    runIds: input.runIds,
    assessmentStatus: input.assessmentStatus,
    sourceStatus: input.sourceStatus,
    redactionProfile: input.redactionProfile,
    verificationPolicy: input.redactionProfile,
    generatorName: "agent-inspect",
    generatorVersion: input.generatorVersion,
    createdAt,
    summaryText: input.summaryText,
    checkSummary: {
      aggregateStatus: input.assessmentStatus,
      runs: input.runIds.map((runId) => ({
        runId,
        status: input.assessmentStatus,
        sourceStatus: input.sourceStatus,
        errors: input.assessmentStatus === "UNSAFE" || input.assessmentStatus === "UNKNOWN" ? 1 : 0,
        warnings: input.assessmentStatus === "SAFE WITH WARNINGS" ? 1 : 0,
        findings: 0,
      })),
    },
  });

  let checkResultsJson = input.checkResultsJson;
  let contractBinding: EvidenceContractBinding | undefined;
  let contractFileContent: string | undefined;

  if (input.contractPackage !== undefined) {
    const packaged = buildEvidenceContractPackage({
      ...input.contractPackage,
      engineVersion: input.contractPackage.engineVersion || input.generatorVersion,
    });
    contractBinding = packaged.binding;
    if (packaged.resolvedJson !== undefined) {
      contractFileContent = packaged.resolvedJson;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(checkResultsJson) as Record<string, unknown>;
    } catch {
      parsed = { raw: checkResultsJson };
    }
    checkResultsJson = serializeCheckResultsJson(
      bindCheckResultsToContract(parsed, packaged.checkBinding),
    );
  }

  const packaged = [
    { path: EVIDENCE_HTML_FILENAME, content: evidenceHtml },
    { path: "check-results.json", content: checkResultsJson },
    { path: "trace.jsonl", content: input.redactedTraceJsonl },
    ...(contractFileContent !== undefined
      ? [{ path: EVIDENCE_RESOLVED_CONTRACT_FILENAME, content: contractFileContent }]
      : []),
  ];

  const manifest = buildEvidenceManifest({
    generatorVersion: input.generatorVersion,
    runIds: input.runIds,
    traceSchemaVersions: [...schemaVersions].sort((a, b) => a.localeCompare(b)),
    sourceHashes,
    redactionProfile: input.redactionProfile,
    verificationPolicy: input.redactionProfile,
    assessmentStatus: input.assessmentStatus,
    sourceStatus: input.sourceStatus,
    files: packaged,
    createdAt,
    note: EVIDENCE_ASSESSMENT_NOTE,
    ...(input.semantics !== undefined ? { semantics: input.semantics } : {}),
    ...(contractBinding !== undefined ? { contract: contractBinding } : {}),
  });

  return {
    "evidence.html": evidenceHtml,
    "evidence.json": serializeEvidenceManifest(manifest),
    "check-results.json": checkResultsJson,
    "trace.jsonl": input.redactedTraceJsonl,
    ...(contractFileContent !== undefined
      ? { [EVIDENCE_RESOLVED_CONTRACT_FILENAME]: contractFileContent }
      : {}),
    manifest,
  };
}

export { EVIDENCE_FORMAT_VERSION, EVIDENCE_HTML_FILENAME, EVIDENCE_MANIFEST_FILENAME };
