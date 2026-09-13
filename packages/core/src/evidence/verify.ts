/**
 * Evidence integrity verification (bundle verify) — schema, presence, hashes.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { sha256Equals, sha256Hex } from "./hash.js";
import { parseEvidenceManifestJson } from "./manifest.js";
import { assertEvidenceRelativePath } from "./paths.js";
import {
  EVIDENCE_MANIFEST_FILENAME,
  EVIDENCE_RESOLVED_CONTRACT_FILENAME,
  type EvidenceManifest,
} from "./types.js";
import { verifyEvidenceContractBinding } from "./contract-binding.js";

export type EvidenceVerifyStatus = "pass" | "fail";

export interface EvidenceVerifyIssue {
  code:
    | "manifest_missing"
    | "manifest_invalid"
    | "file_missing"
    | "file_unexpected"
    | "hash_mismatch"
    | "assessment_missing"
    | "provenance_missing"
    | "path_unsafe"
    | "io_error"
    | "contract_file_missing"
    | "contract_hash_mismatch"
    | "contract_digest_mismatch"
    | "contract_binding_invalid";
  severity: "error" | "warning";
  message: string;
  path?: string;
}

export interface EvidenceVerifyResult {
  ok: boolean;
  status: EvidenceVerifyStatus;
  root: string;
  manifest?: EvidenceManifest;
  issues: EvidenceVerifyIssue[];
  checkedFiles: number;
}

export interface EvidenceVerifyOptions {
  /** Unexpected files: default fail for share/strict-style verification. */
  unexpectedFiles?: "fail" | "warn" | "ignore";
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile()) {
        const rel = path.relative(root, abs).split(path.sep).join("/");
        out.push(rel);
      }
    }
  }
  await walk(root);
  return out.sort((a, b) => a.localeCompare(b));
}

/**
 * Verify an Evidence v2 directory (contains `evidence.json`).
 * Does not extract ZIP archives — callers should unpack first when needed.
 */
export async function verifyEvidenceDirectory(
  rootPath: string,
  options: EvidenceVerifyOptions = {},
): Promise<EvidenceVerifyResult> {
  const unexpectedMode = options.unexpectedFiles ?? "fail";
  const root = path.resolve(rootPath);
  const issues: EvidenceVerifyIssue[] = [];

  let rootStat;
  try {
    rootStat = await stat(root);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: "fail",
      root,
      issues: [{ code: "io_error", severity: "error", message: `Cannot read path: ${message}` }],
      checkedFiles: 0,
    };
  }
  if (!rootStat.isDirectory()) {
    return {
      ok: false,
      status: "fail",
      root,
      issues: [
        {
          code: "io_error",
          severity: "error",
          message: "Evidence verify expects a directory containing evidence.json (unpack ZIP first).",
        },
      ],
      checkedFiles: 0,
    };
  }

  const manifestPath = path.join(root, EVIDENCE_MANIFEST_FILENAME);
  let manifestText: string;
  try {
    manifestText = await readFile(manifestPath, "utf-8");
  } catch {
    return {
      ok: false,
      status: "fail",
      root,
      issues: [
        {
          code: "manifest_missing",
          severity: "error",
          message: `Missing ${EVIDENCE_MANIFEST_FILENAME}`,
          path: EVIDENCE_MANIFEST_FILENAME,
        },
      ],
      checkedFiles: 0,
    };
  }

  let manifest: EvidenceManifest;
  try {
    manifest = parseEvidenceManifestJson(manifestText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: "fail",
      root,
      issues: [
        {
          code: "manifest_invalid",
          severity: "error",
          message,
          path: EVIDENCE_MANIFEST_FILENAME,
        },
      ],
      checkedFiles: 0,
    };
  }

  if (!manifest.assessment?.status) {
    issues.push({
      code: "assessment_missing",
      severity: "error",
      message: "Manifest assessment.status is required.",
    });
  }
  if (!manifest.generator?.name || !manifest.generator?.version) {
    issues.push({
      code: "provenance_missing",
      severity: "error",
      message: "Manifest generator.name and generator.version are required.",
    });
  }
  if (!manifest.source?.runIds?.length) {
    issues.push({
      code: "provenance_missing",
      severity: "error",
      message: "Manifest source.runIds must be non-empty.",
    });
  }

  const listed = new Set<string>();
  for (const file of manifest.files) {
    let rel: string;
    try {
      rel = assertEvidenceRelativePath(file.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push({
        code: "path_unsafe",
        severity: "error",
        message,
        path: file.path,
      });
      continue;
    }
    if (rel === EVIDENCE_MANIFEST_FILENAME) {
      issues.push({
        code: "manifest_invalid",
        severity: "error",
        message: `${EVIDENCE_MANIFEST_FILENAME} must not list itself in files[].`,
        path: rel,
      });
      continue;
    }
    listed.add(rel);
    const abs = path.join(root, ...rel.split("/"));
    let bytes: Buffer;
    try {
      bytes = await readFile(abs);
    } catch {
      issues.push({
        code: "file_missing",
        severity: "error",
        message: `Listed file missing: ${rel}`,
        path: rel,
      });
      continue;
    }
    const actual = sha256Hex(bytes);
    if (!sha256Equals(file.sha256, actual)) {
      issues.push({
        code: "hash_mismatch",
        severity: "error",
        message: `SHA-256 mismatch for ${rel}`,
        path: rel,
      });
    }
  }

  let onDisk: string[] = [];
  try {
    onDisk = await listFilesRecursive(root);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push({ code: "io_error", severity: "error", message });
  }

  for (const rel of onDisk) {
    if (rel === EVIDENCE_MANIFEST_FILENAME) continue;
    if (listed.has(rel)) continue;
    if (unexpectedMode === "ignore") continue;
    issues.push({
      code: "file_unexpected",
      severity: unexpectedMode === "warn" ? "warning" : "error",
      message: `Unexpected file not listed in manifest: ${rel}`,
      path: rel,
    });
  }

  if (manifest.contract !== undefined) {
    const contractRel =
      manifest.contract.path ?? EVIDENCE_RESOLVED_CONTRACT_FILENAME;
    let resolvedBytes: string | undefined;
    try {
      resolvedBytes = await readFile(path.join(root, ...contractRel.split("/")), "utf-8");
    } catch {
      resolvedBytes = undefined;
    }
    let checkResultsJson: string | undefined;
    try {
      checkResultsJson = await readFile(path.join(root, "check-results.json"), "utf-8");
    } catch {
      checkResultsJson = undefined;
    }
    for (const issue of verifyEvidenceContractBinding({
      binding: manifest.contract,
      ...(resolvedBytes !== undefined ? { resolvedContractBytes: resolvedBytes } : {}),
      ...(checkResultsJson !== undefined ? { checkResultsJson } : {}),
    })) {
      issues.push(issue);
    }
  }

  const hasError = issues.some((issue) => issue.severity === "error");
  return {
    ok: !hasError,
    status: hasError ? "fail" : "pass",
    root,
    manifest,
    issues,
    checkedFiles: listed.size,
  };
}
