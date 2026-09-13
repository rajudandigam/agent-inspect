import { sha256Hex } from "./hash.js";
import { assertEvidenceRelativePath } from "./paths.js";
import {
  EVIDENCE_ASSESSMENT_NOTE,
  EVIDENCE_FORMAT_VERSION,
  EVIDENCE_MANIFEST_FILENAME,
  type EvidenceFileEntry,
  type EvidenceFileRole,
  type EvidenceManifest,
  type EvidencePackagedFile,
  type EvidenceRedactionProfile,
  type EvidenceSafeStatus,
  type EvidenceSourceHash,
  type EvidenceVerificationPolicy,
} from "./types.js";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stable(record[key])]),
  );
}

/**
 * Deterministic JSON serialization used for evidence manifests (trailing newline).
 */
export function serializeEvidenceManifest(manifest: EvidenceManifest): string {
  return `${JSON.stringify(stable(manifest), null, 2)}\n`;
}

export function inferEvidenceFileRole(relativePath: string): EvidenceFileRole {
  const normalized = assertEvidenceRelativePath(relativePath);
  const base = normalized.includes("/")
    ? normalized.slice(normalized.lastIndexOf("/") + 1)
    : normalized;
  if (base === "evidence.html" || base === "trace.html" || base.endsWith(".html")) {
    return "report";
  }
  if (base === "trace.jsonl" || base.endsWith(".jsonl")) {
    return "redacted-trace";
  }
  if (base === "check-results.json") {
    return "checks";
  }
  if (base === "contract.resolved.json") {
    return "contract";
  }
  if (base === "redaction-report.json") {
    return "redaction-report";
  }
  if (base === "summary.md") {
    return "summary";
  }
  return "other";
}

/**
 * Hash packaged file bytes into Evidence `files[]` entries (sorted by path).
 * Rejects `evidence.json` itself (manifest is not self-hashed).
 */
export function buildEvidenceFileEntries(
  files: readonly EvidencePackagedFile[],
): EvidenceFileEntry[] {
  const byPath = new Map<string, EvidenceFileEntry>();
  for (const file of files) {
    const relativePath = assertEvidenceRelativePath(file.path);
    if (relativePath === EVIDENCE_MANIFEST_FILENAME) {
      throw new Error(
        `Do not include ${EVIDENCE_MANIFEST_FILENAME} in packaged file hashes (self-hash is undefined).`,
      );
    }
    if (byPath.has(relativePath)) {
      throw new Error(`Duplicate evidence file path: ${relativePath}`);
    }
    byPath.set(relativePath, {
      path: relativePath,
      sha256: sha256Hex(file.content),
      role: file.role ?? inferEvidenceFileRole(relativePath),
    });
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function buildEvidenceManifest(parts: {
  generatorVersion: string;
  generatorName?: string;
  runIds: readonly string[];
  traceSchemaVersions: readonly string[];
  sourceHashes: readonly EvidenceSourceHash[];
  redactionProfile: EvidenceRedactionProfile;
  verificationPolicy?: EvidenceVerificationPolicy;
  assessmentStatus: EvidenceSafeStatus;
  sourceStatus?: EvidenceSafeStatus;
  files: readonly EvidencePackagedFile[];
  createdAt?: string;
  note?: string;
  semantics?: EvidenceManifest["semantics"];
  contract?: EvidenceManifest["contract"];
}): EvidenceManifest {
  const runIds = [...parts.runIds];
  if (runIds.length === 0) {
    throw new Error("Evidence manifest requires at least one run id.");
  }
  for (const item of parts.sourceHashes) {
    if (!runIds.includes(item.runId)) {
      throw new Error(`sourceHashes runId "${item.runId}" is not listed in source.runIds.`);
    }
    if (item.algorithm !== "sha256") {
      throw new Error(`Unsupported source hash algorithm: ${item.algorithm}`);
    }
  }

  const assessment: EvidenceManifest["assessment"] = {
    status: parts.assessmentStatus,
    note: parts.note ?? EVIDENCE_ASSESSMENT_NOTE,
  };
  if (parts.sourceStatus !== undefined) {
    assessment.sourceStatus = parts.sourceStatus;
  }

  return {
    evidenceFormatVersion: EVIDENCE_FORMAT_VERSION,
    generator: {
      name: parts.generatorName ?? "agent-inspect",
      version: parts.generatorVersion,
    },
    createdAt: parts.createdAt ?? new Date().toISOString(),
    source: {
      runIds,
      traceSchemaVersions: [...parts.traceSchemaVersions].sort((a, b) => a.localeCompare(b)),
      sourceHashes: [...parts.sourceHashes].sort((a, b) => a.runId.localeCompare(b.runId)),
    },
    policy: {
      redactionProfile: parts.redactionProfile,
      verificationPolicy: parts.verificationPolicy ?? parts.redactionProfile,
    },
    assessment,
    ...(parts.semantics !== undefined ? { semantics: { ...parts.semantics } } : {}),
    ...(parts.contract !== undefined ? { contract: { ...parts.contract } } : {}),
    files: buildEvidenceFileEntries(parts.files),
  };
}

/**
 * Minimal structural validation for a parsed evidence manifest object.
 * Unknown fields are preserved by returning the cast value after checks.
 */
export function validateEvidenceManifest(value: unknown): EvidenceManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Evidence manifest must be a JSON object.");
  }
  const record = value as Record<string, unknown>;
  if (record.evidenceFormatVersion !== EVIDENCE_FORMAT_VERSION) {
    throw new Error(
      `Unsupported evidenceFormatVersion: ${String(record.evidenceFormatVersion)}`,
    );
  }
  const generator = record.generator;
  if (
    generator === null ||
    typeof generator !== "object" ||
    Array.isArray(generator) ||
    typeof (generator as { name?: unknown }).name !== "string" ||
    typeof (generator as { version?: unknown }).version !== "string"
  ) {
    throw new Error("Evidence manifest requires generator.name and generator.version.");
  }
  const source = record.source;
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    throw new Error("Evidence manifest requires source.");
  }
  const sourceRecord = source as {
    runIds?: unknown;
    traceSchemaVersions?: unknown;
    sourceHashes?: unknown;
  };
  if (!Array.isArray(sourceRecord.runIds) || sourceRecord.runIds.length === 0) {
    throw new Error("Evidence manifest source.runIds must be a non-empty array.");
  }
  if (!Array.isArray(sourceRecord.traceSchemaVersions)) {
    throw new Error("Evidence manifest source.traceSchemaVersions must be an array.");
  }
  if (!Array.isArray(sourceRecord.sourceHashes)) {
    throw new Error("Evidence manifest source.sourceHashes must be an array.");
  }
  const policy = record.policy;
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("Evidence manifest requires policy.");
  }
  const assessment = record.assessment;
  if (
    assessment === null ||
    typeof assessment !== "object" ||
    Array.isArray(assessment) ||
    typeof (assessment as { status?: unknown }).status !== "string"
  ) {
    throw new Error("Evidence manifest requires assessment.status.");
  }
  if (!Array.isArray(record.files) || record.files.length === 0) {
    throw new Error("Evidence manifest files must be a non-empty array.");
  }
  for (const file of record.files) {
    if (file === null || typeof file !== "object" || Array.isArray(file)) {
      throw new Error("Evidence manifest file entries must be objects.");
    }
    const entry = file as { path?: unknown; sha256?: unknown };
    if (typeof entry.path !== "string") {
      throw new Error("Evidence file entry requires path.");
    }
    assertEvidenceRelativePath(entry.path);
    if (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256)) {
      throw new Error(`Evidence file entry requires sha256 hex for ${entry.path}.`);
    }
  }
  return value as EvidenceManifest;
}

export function parseEvidenceManifestJson(text: string): EvidenceManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Evidence manifest is not valid JSON: ${message}`);
  }
  return validateEvidenceManifest(parsed);
}

/**
 * Collect unique `schemaVersion` values from agent-inspect JSONL text.
 */
export function collectTraceSchemaVersions(jsonl: string): string[] {
  const versions = new Set<string>();
  for (const line of jsonl.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    try {
      const row = JSON.parse(trimmed) as { schemaVersion?: unknown };
      if (typeof row.schemaVersion === "string" && row.schemaVersion.trim() !== "") {
        versions.add(row.schemaVersion.trim());
      }
    } catch {
      // skip malformed lines — hashing still covers the raw bytes separately
    }
  }
  return [...versions].sort((a, b) => a.localeCompare(b));
}
