import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildBundleMetadata,
  buildBundleSummaryMarkdown,
  buildEvidenceCausalFailureViewHtml,
  buildEvidenceCircuitViewHtml,
  buildEvidenceContractsViewHtml,
  buildEvidenceDiffViewHtml,
  buildEvidenceHtmlShell,
  buildEvidenceManifest,
  buildEvidenceOutcomesViewHtml,
  buildEvidenceProvenanceViewHtml,
  buildEvidenceSafetyViewHtml,
  buildEvidenceTimelineViewHtml,
  buildEvidenceToolsLlmViewHtml,
  buildEvidenceTreeViewHtml,
  buildPlaceholderArtifact,
  buildSessionIndex,
  buildZipArchive,
  bundleFailsOnSafety,
  collectTraceSchemaVersions,
  defaultBundleOutputPath,
  getTraceFilePath,
  inferEvidenceFileRole,
  normalizeBundleOutputPath,
  parseDuration,
  resolveBundleRunIds,
  resolveTraceDir,
  aggregateBundleSafeStatus,
  sanitizeBundleRunId,
  serializeEvidenceManifest,
  sha256Hex,
  bundleRunAssetRelativePath,
  assertBundlePathContained,
  assertEvidenceRelativePath,
  EVIDENCE_FORMAT_VERSION,
  EVIDENCE_HTML_FILENAME,
  EVIDENCE_MANIFEST_FILENAME,
  type BundleCheckResults,
  type BundleRedactionProfile,
  type BundleRedactionReport,
  type BundleSafeStatus,
  type EvidenceCheckFindingSummary,
  type EvidencePackagedFile,
  type EvidenceSourceHash,
  type InspectRunTree,
} from "@agent-inspect/core/advanced";
import { exportRunTree } from "@agent-inspect/core/exporters";
import { openTrace } from "@agent-inspect/core/readers";
import type { PersistedInspectEvent } from "@agent-inspect/core/persisted";
import { readWorkspaceManifestFile, resolveInsideWorkspace, resolveWorkspaceLocation } from "@agent-inspect/core/workspace";
import type { RedactionProfile } from "@agent-inspect/redact";

import { version as packageVersion } from "../../../package.json";
import {
  resolveOutputOption,
  resolveRedactionProfileOption,
} from "./cli-option-aliases.js";
import { redactTraceContent } from "./redact-content.js";
import { assessOpenedTrace } from "./safety.js";
import { loadSessionRuns } from "./sessions-load.js";

export type BundleOutputFormat = "directory" | "html" | "zip";

export interface BundleCommandOptions {
  dir?: string;
  session?: string;
  since?: string;
  /** Canonical alias of `--profile`. */
  redactionProfile?: string;
  profile?: string;
  /** Canonical alias of `--out`. */
  output?: string;
  out?: string;
  /** Output mode: directory (default), html (+ sidecar), or zip. */
  format?: BundleOutputFormat;
  allowUnsafe?: boolean;
  json?: boolean;
  correlateGroup?: boolean;
  staleAfter?: string;
}

const BUNDLE_NOTE =
  "Generated locally by AgentInspect. Bundles are derived copies for review — not compliance or security certification.";

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

function writeJson(value: unknown): string {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function parseBundleProfile(value: string | undefined): BundleRedactionProfile {
  if (value === undefined || value === "local" || value === "share" || value === "strict") {
    return value ?? "share";
  }
  throw new Error(`Unsupported --profile "${value}". Use local, share, or strict.`);
}

function toReportProfile(profile: BundleRedactionProfile): RedactionProfile {
  return profile;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safetyStatusFromAssess(status: string): BundleSafeStatus {
  if (
    status === "SAFE" ||
    status === "SAFE WITH WARNINGS" ||
    status === "UNSAFE" ||
    status === "UNKNOWN"
  ) {
    return status;
  }
  return "UNKNOWN";
}

function parseBundleFormat(value: string | undefined): BundleOutputFormat {
  if (value === undefined || value === "directory" || value === "html" || value === "zip") {
    return value ?? "directory";
  }
  throw new Error(`Unsupported --format "${value}". Use directory, html, or zip.`);
}

async function resolveOutputDir(
  options: BundleCommandOptions,
  runIds: readonly string[],
  cwd: string,
  format: BundleOutputFormat,
): Promise<string> {
  const out = resolveOutputOption(options);
  if (out !== undefined) {
    const normalized = normalizeBundleOutputPath(out, {
      preserveZipExtension: format === "zip",
    });
    try {
      const location = resolveWorkspaceLocation(cwd);
      const manifest = await readWorkspaceManifestFile(location);
      if (manifest.ok && manifest.manifest) {
        const rel = path.relative(location.workspaceDir, normalized);
        if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
          return resolveInsideWorkspace(location.workspaceDir, rel);
        }
      }
    } catch {
      // not a workspace-relative path — use normalized absolute path
    }
    return normalized;
  }

  try {
    const location = resolveWorkspaceLocation(cwd);
    const manifest = await readWorkspaceManifestFile(location);
    if (manifest.ok && manifest.manifest) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const label =
        runIds.length === 1 ? sanitizeBundleRunId(runIds[0]!) : `multi-${runIds.length}`;
      const base = resolveInsideWorkspace(
        location.workspaceDir,
        path.join(manifest.manifest.bundlesDir, `bundle-${label}-${stamp}`),
      );
      return format === "zip" ? `${base}.zip` : base;
    }
  } catch {
    // fall through
  }

  const base = defaultBundleOutputPath(runIds);
  return format === "zip" ? `${base}.zip` : base;
}

function stageBundleFile(
  relativePath: string,
  content: string,
  files: string[],
  packaged: Map<string, string>,
): void {
  const safe = assertEvidenceRelativePath(relativePath);
  if (!files.includes(safe)) files.push(safe);
  packaged.set(safe, content);
}

function renderBundleIndexHtml(parts: {
  runIds: readonly string[];
  reports: ReadonlyMap<string, string>;
}): string {
  const links = parts.runIds
    .map(
      (runId) =>
        `<li><a href="${escapeHtml(bundleRunAssetRelativePath(runId, ".html"))}">${escapeHtml(runId)}</a></li>`,
    )
    .join("");
  const sections = parts.runIds
    .map((runId) => {
      const html = parts.reports.get(runId) ?? "";
      return `<section id="run-${escapeHtml(runId)}"><h2>${escapeHtml(runId)}</h2>${html}</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AgentInspect Bundle</title>
<style>
body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:960px;color:#111}
a{color:#0366d6}
section{border-top:1px solid #ddd;margin-top:1.5rem;padding-top:1rem}
</style>
</head>
<body>
<h1>AgentInspect trace bundle</h1>
<p>${escapeHtml(BUNDLE_NOTE)}</p>
<h2>Runs</h2>
<ul>${links}</ul>
${sections}
</body>
</html>
`;
}

function extractHtmlBody(content: string): string {
  const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match?.[1]?.trim() ?? content;
}

export async function bundleCommand(
  runIdArg: string | undefined,
  options: BundleCommandOptions = {},
): Promise<void> {
  const profile = parseBundleProfile(resolveRedactionProfileOption(options));
  const format = parseBundleFormat(options.format);
  const traceDir = resolveTraceDir({ dir: options.dir });
  const cwd = process.cwd();

  let resolveResult;
  try {
    const { runs } = await loadSessionRuns(traceDir);
    const staleThresholdMs =
      options.staleAfter && options.staleAfter.trim() !== ""
        ? parseDuration(options.staleAfter.trim())
        : undefined;
    const index = buildSessionIndex(runs, {
      correlateByGroupId: options.correlateGroup === true,
      staleThresholdMs,
    });
    resolveResult = resolveBundleRunIds(index, runs, {
      ...(runIdArg !== undefined && runIdArg.trim() !== "" ? { runId: runIdArg.trim() } : {}),
      ...(options.session ? { sessionId: options.session } : {}),
      ...(options.since ? { since: options.since } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(writeJson({ ok: false, error: message }).trimEnd());
    } else {
      console.error(`[AgentInspect] bundle failed: ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  const outputDir = await resolveOutputDir(options, resolveResult.runIds, cwd, format);
  const files: string[] = [];
  const packaged = new Map<string, string>();
  const checkRuns: BundleCheckResults["runs"] = [];
  const redactionRuns: BundleRedactionReport["runs"] = [];
  const htmlByRun = new Map<string, string>();
  const redactedJsonlByRun = new Map<string, string>();
  const artifactTrees: InspectRunTree[] = [];
  const artifactEventsByRun = new Map<string, PersistedInspectEvent[]>();
  const findingSummaries: EvidenceCheckFindingSummary[] = [];
  const sourceHashes: EvidenceSourceHash[] = [];
  const schemaVersions = new Set<string>();
  let combinedJsonl = "";

  for (const runId of resolveResult.runIds) {
    const tracePath = getTraceFilePath(runId, traceDir);
    let rawContent: string;
    let sourceMtimeMs: number;
    try {
      rawContent = await readFile(tracePath, "utf-8");
      sourceMtimeMs = (await stat(tracePath)).mtimeMs;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.json) {
        console.log(writeJson({ ok: false, error: message, runId }).trimEnd());
      } else {
        console.error(`[AgentInspect] bundle failed: ${message}`);
      }
      process.exitCode = 1;
      return;
    }

    let read;
    try {
      read = await openTrace(
        { type: "file", path: tracePath },
        { format: "agent-inspect-jsonl" },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.json) {
        console.log(writeJson({ ok: false, error: message, runId }).trimEnd());
      } else {
        console.error(`[AgentInspect] bundle failed: ${message}`);
      }
      process.exitCode = 1;
      return;
    }

    const sourceSafety = assessOpenedTrace(read, { run: runId });
    const sourceStatus = safetyStatusFromAssess(sourceSafety.status);

    sourceHashes.push({
      runId,
      algorithm: "sha256",
      hash: sha256Hex(rawContent),
    });
    for (const version of collectTraceSchemaVersions(rawContent)) {
      schemaVersions.add(version);
    }

    const redacted = redactTraceContent(rawContent, toReportProfile(profile));
    redactedJsonlByRun.set(runId, redacted.content);
    combinedJsonl += redacted.content.endsWith("\n") ? redacted.content : `${redacted.content}\n`;

    const detectors = [
      ...new Set(redacted.findings.map((finding) => finding.detector)),
    ].sort((a, b) => a.localeCompare(b));
    redactionRuns.push({
      runId,
      findings: redacted.findings.length,
      detectors,
    });

    let artifactSafety = sourceSafety;
    let artifactTree: InspectRunTree | undefined;
    try {
      const artifactRead = await openTrace(
        { type: "string", content: redacted.content },
        { format: "agent-inspect-jsonl" },
      );
      artifactSafety = assessOpenedTrace(artifactRead, { run: runId });
      artifactTree =
        artifactRead.runs.find((run) => run.runId === runId) ?? artifactRead.runs[0];
      artifactEventsByRun.set(
        runId,
        artifactRead.events.filter((event) => event.runId === runId),
      );
    } catch {
      // If the redacted artifact cannot be re-read, fail closed on UNKNOWN.
      artifactSafety = {
        ...sourceSafety,
        status: "UNKNOWN",
        ok: false,
        summary: {
          findings: sourceSafety.summary.findings,
          warnings: sourceSafety.summary.warnings,
          errors: Math.max(1, sourceSafety.summary.errors),
        },
      };
    }

    for (const finding of artifactSafety.findings) {
      findingSummaries.push({
        runId,
        ruleId: finding.ruleId,
        severity: finding.severity,
        message: finding.message,
        ...(finding.category !== undefined ? { category: finding.category } : {}),
        ...(finding.detector !== undefined ? { detector: finding.detector } : {}),
        ...(finding.confidence !== undefined ? { confidence: finding.confidence } : {}),
        ...(finding.action !== undefined ? { action: finding.action } : {}),
      });
    }

    if (artifactTree) {
      artifactTrees.push(artifactTree);
    } else {
      const selected = read.runs.find((run) => run.runId === runId);
      if (selected) artifactTrees.push(selected);
    }

    const status = safetyStatusFromAssess(artifactSafety.status);
    checkRuns.push({
      runId,
      status,
      sourceStatus,
      errors: artifactSafety.summary.errors,
      warnings: artifactSafety.summary.warnings,
      findings: artifactSafety.summary.findings,
    });

    const selected = read.runs.find((run) => run.runId === runId);
    const runReport = exportRunTree(selected ?? read.runs[0]!, {
      format: "html",
      redacted: true,
      redactionProfile: toReportProfile(profile),
    });
    htmlByRun.set(runId, extractHtmlBody(runReport.content));

    // Verify source file was not mutated
    const afterMtime = (await stat(tracePath)).mtimeMs;
    if (afterMtime !== sourceMtimeMs) {
      const message = `Source trace "${runId}" was modified during bundle creation.`;
      if (options.json) {
        console.log(writeJson({ ok: false, error: message }).trimEnd());
      } else {
        console.error(`[AgentInspect] bundle failed: ${message}`);
      }
      process.exitCode = 1;
      return;
    }
  }

  const checks: BundleCheckResults = {
    aggregateStatus: aggregateBundleSafeStatus(checkRuns.map((run) => run.status)),
    runs: checkRuns,
  };

  if (bundleFailsOnSafety(checks.aggregateStatus, options.allowUnsafe === true)) {
    if (options.json) {
      console.log(
        writeJson({
          ok: false,
          error: `Bundle artifact safety status is ${checks.aggregateStatus}. Pass --allow-unsafe to override.`,
          checks,
        }).trimEnd(),
      );
    } else {
      console.error(
        `[AgentInspect] bundle refused: artifact safety status is ${checks.aggregateStatus}. Pass --allow-unsafe to override.`,
      );
    }
    process.exitCode = 1;
    return;
  }

  const redactionReport: BundleRedactionReport = {
    profile,
    totalFindings: redactionRuns.reduce((sum, run) => sum + run.findings, 0),
    runs: redactionRuns,
  };

  for (const runId of resolveResult.runIds) {
    const jsonl = redactedJsonlByRun.get(runId) ?? "";
    stageBundleFile(
      bundleRunAssetRelativePath(runId, ".jsonl"),
      jsonl,
      files,
      packaged,
    );
    const html = htmlByRun.get(runId) ?? "";
    stageBundleFile(
      bundleRunAssetRelativePath(runId, ".html"),
      runReportWrap(html, runId),
      files,
      packaged,
    );
  }

  const primaryRunId = resolveResult.runIds[0]!;
  const traceHtml =
    resolveResult.runIds.length === 1
      ? runReportWrap(htmlByRun.get(primaryRunId) ?? "", primaryRunId)
      : renderBundleIndexHtml({ runIds: resolveResult.runIds, reports: htmlByRun });

  stageBundleFile("trace.jsonl", combinedJsonl, files, packaged);
  stageBundleFile("trace.html", traceHtml, files, packaged);
  stageBundleFile("check-results.json", writeJson(checks), files, packaged);
  stageBundleFile(
    "eval-results.json",
    writeJson(buildPlaceholderArtifact()),
    files,
    packaged,
  );
  stageBundleFile(
    "redaction-report.json",
    writeJson(redactionReport),
    files,
    packaged,
  );
  stageBundleFile(
    "performance-summary.json",
    writeJson(buildPlaceholderArtifact()),
    files,
    packaged,
  );

  const summaryPath = "summary.md";
  const metadataPath = "metadata.json";

  const aggregateSourceStatus = aggregateBundleSafeStatus(
    checkRuns.map((run) => run.sourceStatus ?? run.status),
  );

  // Known packaged names before writing summary/html/manifest so summary + metadata agree.
  const metadataFileList = [
    ...files,
    summaryPath,
    EVIDENCE_HTML_FILENAME,
    metadataPath,
    EVIDENCE_MANIFEST_FILENAME,
  ]
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort((a, b) => a.localeCompare(b));

  const metadata = buildBundleMetadata({
    agentInspectVersion: packageVersion,
    profile,
    resolve: resolveResult,
    checks,
    files: metadataFileList,
  });
  const summaryMd = buildBundleSummaryMarkdown({
    metadata,
    checks,
    redaction: redactionReport,
  });
  const evidenceHtml = buildEvidenceHtmlShell({
    title: "AgentInspect evidence",
    runIds: resolveResult.runIds,
    assessmentStatus: checks.aggregateStatus,
    sourceStatus: aggregateSourceStatus,
    redactionProfile: profile,
    verificationPolicy: profile,
    generatorName: "agent-inspect",
    generatorVersion: packageVersion,
    createdAt: metadata.createdAt,
    summaryText: summaryMd,
    checkSummary: {
      aggregateStatus: checks.aggregateStatus,
      runs: checkRuns,
    },
    viewBodies: {
      tree: buildEvidenceTreeViewHtml(artifactTrees),
      timeline: buildEvidenceTimelineViewHtml(artifactTrees),
      causal: buildEvidenceCausalFailureViewHtml(artifactTrees),
      "tools-llm": buildEvidenceToolsLlmViewHtml(artifactTrees),
      contracts: buildEvidenceContractsViewHtml({
        aggregateStatus: checks.aggregateStatus,
        runs: checkRuns,
        findingSummaries,
      }),
      outcomes: buildEvidenceOutcomesViewHtml(
        resolveResult.runIds.map((id) => ({
          runId: id,
          events: artifactEventsByRun.get(id) ?? [],
        })),
      ),
      circuit: buildEvidenceCircuitViewHtml(),
      diff:
        resolveResult.runIds.length >= 2
          ? buildEvidenceDiffViewHtml({
              leftRunId: resolveResult.runIds[0]!,
              rightRunId: resolveResult.runIds[1]!,
              leftEvents: artifactEventsByRun.get(resolveResult.runIds[0]!) ?? [],
              rightEvents: artifactEventsByRun.get(resolveResult.runIds[1]!) ?? [],
            })
          : buildEvidenceDiffViewHtml(),
      safety: buildEvidenceSafetyViewHtml({
        artifactStatus: checks.aggregateStatus,
        sourceStatus: aggregateSourceStatus,
        redactionProfile: profile,
        verificationPolicy: profile,
        redaction: redactionReport,
        findingSummaries,
      }),
      provenance: buildEvidenceProvenanceViewHtml({
        generatorName: "agent-inspect",
        generatorVersion: packageVersion,
        evidenceFormatVersion: EVIDENCE_FORMAT_VERSION,
        createdAt: metadata.createdAt,
        runIds: resolveResult.runIds,
        traceSchemaVersions: [...schemaVersions].sort((a, b) => a.localeCompare(b)),
        sourceHashes,
        packagedFiles: metadataFileList
          .filter((name) => name !== EVIDENCE_MANIFEST_FILENAME)
          .map((name) => ({ path: name, role: inferEvidenceFileRole(name) })),
      }),
    },
  });

  stageBundleFile(EVIDENCE_HTML_FILENAME, evidenceHtml, files, packaged);
  stageBundleFile(summaryPath, summaryMd, files, packaged);

  const metadataJson = writeJson(metadata);
  packaged.set(metadataPath, metadataJson);
  if (!files.includes(metadataPath)) {
    files.push(metadataPath);
  }

  const evidenceFiles: EvidencePackagedFile[] = [...packaged.entries()].map(
    ([relativePath, content]) => ({ path: relativePath, content }),
  );

  const evidence = buildEvidenceManifest({
    generatorVersion: packageVersion,
    runIds: resolveResult.runIds,
    traceSchemaVersions: [...schemaVersions].sort((a, b) => a.localeCompare(b)),
    sourceHashes,
    redactionProfile: profile,
    verificationPolicy: profile,
    assessmentStatus: checks.aggregateStatus,
    sourceStatus: aggregateSourceStatus,
    files: evidenceFiles,
    createdAt: metadata.createdAt,
  });
  let evidenceJson = serializeEvidenceManifest(evidence);
  let outputPath = outputDir;

  if (format === "html") {
    const htmlContent = packaged.get(EVIDENCE_HTML_FILENAME) ?? evidenceHtml;
    const htmlEvidence = buildEvidenceManifest({
      generatorVersion: packageVersion,
      runIds: resolveResult.runIds,
      traceSchemaVersions: [...schemaVersions].sort((a, b) => a.localeCompare(b)),
      sourceHashes,
      redactionProfile: profile,
      verificationPolicy: profile,
      assessmentStatus: checks.aggregateStatus,
      sourceStatus: aggregateSourceStatus,
      files: [{ path: EVIDENCE_HTML_FILENAME, content: htmlContent }],
      createdAt: metadata.createdAt,
    });
    evidenceJson = serializeEvidenceManifest(htmlEvidence);

    let htmlPath = outputDir;
    let sidecarDir = outputDir;
    if (outputDir.toLowerCase().endsWith(".html")) {
      htmlPath = outputDir;
      sidecarDir = path.dirname(outputDir);
    } else {
      await mkdir(outputDir, { recursive: true });
      htmlPath = path.join(outputDir, EVIDENCE_HTML_FILENAME);
      sidecarDir = outputDir;
    }
    await mkdir(sidecarDir, { recursive: true });
    await writeFile(htmlPath, htmlContent, "utf-8");
    await writeFile(path.join(sidecarDir, EVIDENCE_MANIFEST_FILENAME), evidenceJson, "utf-8");
    outputPath = htmlPath;
  } else if (format === "zip") {
    const zipPath = outputDir.toLowerCase().endsWith(".zip")
      ? outputDir
      : `${outputDir}.zip`;
    const zipParent = path.dirname(zipPath);
    await mkdir(zipParent, { recursive: true });
    const entries = [
      ...[...packaged.entries()].map(([relativePath, content]) => ({
        path: relativePath,
        content,
      })),
      { path: EVIDENCE_MANIFEST_FILENAME, content: evidenceJson },
    ];
    const archive = buildZipArchive(entries);
    await writeFile(zipPath, archive);
    outputPath = zipPath;
  } else {
    await mkdir(outputDir, { recursive: true });
    for (const [relativePath, content] of packaged.entries()) {
      const outPath = assertBundlePathContained(outputDir, relativePath);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, content, "utf-8");
    }
    await writeFile(path.join(outputDir, EVIDENCE_MANIFEST_FILENAME), evidenceJson, "utf-8");
    if (!files.includes(EVIDENCE_MANIFEST_FILENAME)) {
      files.push(EVIDENCE_MANIFEST_FILENAME);
    }
    outputPath = outputDir;
  }

  if (options.json) {
    console.log(
      writeJson({
        ok: true,
        format,
        outputDir: outputPath,
        metadata,
        evidence: format === "html" ? JSON.parse(evidenceJson) : evidence,
        checks,
        redaction: redactionReport,
      }).trimEnd(),
    );
    return;
  }

  console.log(`Bundle written to ${outputPath}`);
  console.log(`Format: ${format}`);
  console.log(`Safe status: ${metadata.safeStatus}`);
  console.log(`Runs: ${resolveResult.runIds.join(", ")}`);
  console.log(`Files: ${metadata.files.length}`);
}

function runReportWrap(body: string, runId: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AgentInspect — ${escapeHtml(runId)}</title>
<style>body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:960px;color:#111}</style>
</head>
<body>
${body}
</body>
</html>
`;
}
