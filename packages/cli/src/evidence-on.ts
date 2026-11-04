import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildEvidenceCiPackage,
  buildZipArchive,
  getTraceFilePath,
  resolveTraceDir,
  type EvidenceSafeStatus,
  type BuildEvidenceContractPackageInput,
} from "@agent-inspect/core/advanced";
import { createEvidenceCiArtifacts } from "@agent-inspect/core/reporters";
import type { TraceCheckResult } from "@agent-inspect/core/checks";
import type { RedactionProfile } from "@agent-inspect/redact";

import { version as packageVersion } from "../../../package.json";
import { redactTraceContent } from "./redact.js";
import {
  assessResidualFromContent,
  type ResidualSafetyStatus,
} from "./safety.js";

export type EvidenceOnMode = "fail" | "always" | "never";
export type EvidenceEmitFormat = "directory" | "html" | "zip";

export function shouldEmitEvidence(
  mode: EvidenceOnMode | undefined,
  failed: boolean,
): boolean {
  if (mode === undefined || mode === "never") return false;
  if (mode === "always") return true;
  return failed;
}

export function parseEvidenceProfile(
  value: string | undefined,
): RedactionProfile {
  const profile = (value ?? "share").trim().toLowerCase();
  if (profile === "local" || profile === "share" || profile === "strict") {
    return profile;
  }
  throw new Error(
    `Unsupported --evidence-profile "${value}". Use local, share, or strict.`,
  );
}

export function parseEvidenceFormat(
  value: string | undefined,
): EvidenceEmitFormat {
  const format = (value ?? "directory").trim().toLowerCase();
  if (format === "directory" || format === "html" || format === "zip") {
    return format;
  }
  throw new Error(
    `Unsupported --evidence-format "${value}". Use directory, html, or zip.`,
  );
}

/** Map residual verify-safe status onto Evidence assessment.status (#519). */
export function residualStatusToEvidenceSafe(
  status: ResidualSafetyStatus,
): EvidenceSafeStatus {
  if (status === "SAFE_WITH_WARNINGS") return "SAFE WITH WARNINGS";
  return status;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Make check-results.json `aggregateStatus` match the residual artifact
 * assessment written into evidence.json (#529). Gate/check pass-fail stay in
 * nested result fields (`gate`, findings, runs), not in aggregateStatus.
 * Must run before hashing so digests cover the final bytes.
 */
export function alignCheckResultsAggregateStatus(
  checkResultsJson: string,
  assessmentStatus: EvidenceSafeStatus,
): string {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(checkResultsJson) as Record<string, unknown>;
  } catch {
    return stableJson({
      aggregateStatus: assessmentStatus,
      raw: checkResultsJson,
    });
  }
  return stableJson({
    ...parsed,
    aggregateStatus: assessmentStatus,
  });
}

export interface WriteLocalEvidenceInput {
  /** Destination directory (or base path) for Evidence v2 files. */
  outputDir: string;
  runIds: readonly string[];
  /** Optional preloaded source bytes keyed by run id. */
  sourceContents?: ReadonlyMap<string, string> | Record<string, string>;
  /** Trace directory used when sourceContents omit a run. */
  dir?: string;
  /**
   * @deprecated Ignored for assessment.status. Trajectory pass/fail belongs in
   * check-results / summaryText; assessment is residual verify-safe (#519).
   */
  failed?: boolean;
  checkResultsJson: string;
  summaryText?: string;
  redactionProfile?: RedactionProfile;
  format?: EvidenceEmitFormat;
  /**
   * When set, bind the evaluated TraceContract into Evidence
   * (`contract.resolved.json` + check-results digests).
   */
  contractPackage?: BuildEvidenceContractPackageInput;
}

/**
 * Write a minimal local Evidence v2 package (no upload).
 * Reuses the same CI package builder as `artifacts`.
 */
export async function writeLocalEvidence(
  input: WriteLocalEvidenceInput,
): Promise<string> {
  const profile = input.redactionProfile ?? "share";
  const format = input.format ?? "directory";
  const baseDir = path.resolve(input.outputDir);
  await mkdir(
    format === "zip" && baseDir.toLowerCase().endsWith(".zip")
      ? path.dirname(baseDir)
      : baseDir,
    { recursive: true },
  );

  const sourceContents = new Map<string, string>();
  if (input.sourceContents instanceof Map) {
    for (const [runId, content] of input.sourceContents) {
      sourceContents.set(runId, content);
    }
  } else if (input.sourceContents !== undefined) {
    for (const [runId, content] of Object.entries(input.sourceContents)) {
      sourceContents.set(runId, content);
    }
  }

  const traceDir = resolveTraceDir({ dir: input.dir });
  let combined = "";
  for (const runId of input.runIds) {
    let raw = sourceContents.get(runId) ?? "";
    if (raw === "") {
      try {
        raw = await readFile(getTraceFilePath(runId, traceDir), "utf-8");
      } catch {
        raw = "";
      }
      sourceContents.set(runId, raw);
    }
    const redacted = redactTraceContent(raw, profile);
    combined += redacted.content.endsWith("\n")
      ? redacted.content
      : `${redacted.content}\n`;
  }

  // Assessment is residual safety of the written artifact, not check pass/fail (#519).
  const residual = await assessResidualFromContent(combined, {
    format: "agent-inspect-jsonl",
  });
  const assessmentStatus = residualStatusToEvidenceSafe(residual.status);
  // Align check-results aggregateStatus before hashing (#529).
  const checkResultsJson = alignCheckResultsAggregateStatus(
    input.checkResultsJson,
    assessmentStatus,
  );
  const evidencePackage = buildEvidenceCiPackage({
    generatorVersion: packageVersion,
    runIds: input.runIds,
    sourceContents,
    redactedTraceJsonl: combined,
    redactionProfile: profile,
    assessmentStatus,
    checkResultsJson,
    ...(input.summaryText !== undefined ? { summaryText: input.summaryText } : {}),
    ...(input.contractPackage !== undefined
      ? { contractPackage: input.contractPackage }
      : {}),
  });

  const files: Array<[string, string]> = [
    ["evidence.html", evidencePackage["evidence.html"]],
    ["evidence.json", evidencePackage["evidence.json"]],
    ["check-results.json", evidencePackage["check-results.json"]],
    ["trace.jsonl", evidencePackage["trace.jsonl"]],
  ];
  const resolvedContract = evidencePackage["contract.resolved.json"];
  if (resolvedContract !== undefined) {
    files.push(["contract.resolved.json", resolvedContract]);
  }

  const expected = createEvidenceCiArtifacts({
    redactionProfile: profile,
  }).map((a) => a.path);
  for (const name of expected) {
    if (!files.some(([fileName]) => fileName === name)) {
      throw new Error(`Evidence CI package missing expected file: ${name}`);
    }
  }

  if (format === "zip") {
    const zipPath = baseDir.toLowerCase().endsWith(".zip")
      ? baseDir
      : `${baseDir}.zip`;
    await mkdir(path.dirname(zipPath), { recursive: true });
    const archive = buildZipArchive(
      files.map(([relativePath, content]) => ({
        path: relativePath,
        content,
      })),
    );
    await writeFile(zipPath, archive);
    return zipPath;
  }

  if (format === "html") {
    let htmlPath = baseDir;
    let sidecarDir = baseDir;
    if (baseDir.toLowerCase().endsWith(".html")) {
      htmlPath = baseDir;
      sidecarDir = path.dirname(baseDir);
    } else {
      await mkdir(baseDir, { recursive: true });
      htmlPath = path.join(baseDir, "evidence.html");
      sidecarDir = baseDir;
    }
    await mkdir(sidecarDir, { recursive: true });
    await writeFile(htmlPath, evidencePackage["evidence.html"], "utf-8");
    await writeFile(
      path.join(sidecarDir, "evidence.json"),
      evidencePackage["evidence.json"],
      "utf-8",
    );
    return htmlPath;
  }

  await mkdir(baseDir, { recursive: true });
  for (const [name, content] of files) {
    await writeFile(path.join(baseDir, name), content, "utf-8");
  }
  return baseDir;
}

/**
 * Serialize check outcomes for Evidence check-results.json.
 * `aggregateStatus` is a provisional placeholder; `writeLocalEvidence`
 * overwrites it with residual artifact assessment before hashing (#529).
 * Check pass/fail remains in findings / ruleExecutions / per-run checkStatus.
 */
export function checkResultToEvidenceJson(
  result: TraceCheckResult,
  runIds: readonly string[],
): string {
  return stableJson({
    aggregateStatus: "UNKNOWN",
    checkStatus: result.status,
    runs: runIds.map((runId) => ({
      runId,
      checkStatus: result.status,
      errors: result.summary.errors,
      warnings: result.summary.warnings,
      findings: result.findings.length,
      rulesEvaluated: result.summary.rulesEvaluated ?? 0,
    })),
    rulesEvaluated: result.summary.rulesEvaluated ?? 0,
    evaluatedRuleIds: (result.ruleExecutions ?? []).map((item) => item.ruleId),
    findings: result.findings,
    diagnostics: result.diagnostics,
  });
}

export function defaultEvidenceDir(label: string): string {
  const safe = label.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "evidence";
  return path.join(".agent-inspect", "evidence", safe);
}

export function resolveEvidenceOutputDir(
  evidenceDir: string | undefined,
  label: string,
): string {
  if (evidenceDir !== undefined && evidenceDir.trim() !== "") {
    return path.resolve(evidenceDir.trim());
  }
  return defaultEvidenceDir(label);
}
