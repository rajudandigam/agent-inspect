import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildEvidenceCiPackage,
  buildZipArchive,
  getTraceFilePath,
  resolveTraceDir,
  type EvidenceSafeStatus,
} from "@agent-inspect/core/advanced";
import { createEvidenceCiArtifacts } from "@agent-inspect/core/reporters";
import type { TraceCheckResult } from "@agent-inspect/core/checks";
import type { RedactionProfile } from "@agent-inspect/redact";

import { version as packageVersion } from "../../../package.json";
import { redactTraceContent } from "./redact-content.js";

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

function toAssessmentStatus(failed: boolean): EvidenceSafeStatus {
  return failed ? "UNSAFE" : "SAFE";
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export interface WriteLocalEvidenceInput {
  /** Destination directory (or base path) for Evidence v2 files. */
  outputDir: string;
  runIds: readonly string[];
  /** Optional preloaded source bytes keyed by run id. */
  sourceContents?: ReadonlyMap<string, string> | Record<string, string>;
  /** Trace directory used when sourceContents omit a run. */
  dir?: string;
  failed: boolean;
  checkResultsJson: string;
  summaryText?: string;
  redactionProfile?: RedactionProfile;
  format?: EvidenceEmitFormat;
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

  const assessmentStatus = toAssessmentStatus(input.failed);
  const evidencePackage = buildEvidenceCiPackage({
    generatorVersion: packageVersion,
    runIds: input.runIds,
    sourceContents,
    redactedTraceJsonl: combined,
    redactionProfile: profile,
    assessmentStatus,
    checkResultsJson: input.checkResultsJson,
    ...(input.summaryText !== undefined ? { summaryText: input.summaryText } : {}),
  });

  const files: Array<[string, string]> = [
    ["evidence.html", evidencePackage["evidence.html"]],
    ["evidence.json", evidencePackage["evidence.json"]],
    ["check-results.json", evidencePackage["check-results.json"]],
    ["trace.jsonl", evidencePackage["trace.jsonl"]],
  ];

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

export function checkResultToEvidenceJson(
  result: TraceCheckResult,
  runIds: readonly string[],
): string {
  const status: EvidenceSafeStatus =
    result.status === "pass"
      ? "SAFE"
      : result.status === "fail"
        ? "UNSAFE"
        : "UNKNOWN";
  return stableJson({
    aggregateStatus: status,
    runs: runIds.map((runId) => ({
      runId,
      status,
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
