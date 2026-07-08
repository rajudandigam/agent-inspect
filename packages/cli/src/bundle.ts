import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildBundleMetadata,
  buildBundleSummaryMarkdown,
  buildPlaceholderArtifact,
  buildSessionIndex,
  bundleFailsOnSafety,
  defaultBundleOutputPath,
  getTraceFilePath,
  normalizeBundleOutputPath,
  parseDuration,
  resolveBundleRunIds,
  resolveTraceDir,
  aggregateBundleSafeStatus,
  type BundleCheckResults,
  type BundleRedactionProfile,
  type BundleRedactionReport,
  type BundleSafeStatus,
} from "@agent-inspect/core/advanced";
import { exportRunTree } from "@agent-inspect/core/exporters";
import { openTrace } from "@agent-inspect/core/readers";
import { readWorkspaceManifestFile, resolveInsideWorkspace, resolveWorkspaceLocation } from "@agent-inspect/core/workspace";
import type { RedactionProfile } from "@agent-inspect/redact";

import { version as packageVersion } from "../../../package.json";
import { redactTraceContent } from "./redact.js";
import { assessOpenedTrace } from "./safety.js";
import { loadSessionRuns } from "./sessions-load.js";

export interface BundleCommandOptions {
  dir?: string;
  session?: string;
  since?: string;
  profile?: string;
  out?: string;
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

async function resolveOutputDir(
  options: BundleCommandOptions,
  runIds: readonly string[],
  cwd: string,
): Promise<string> {
  if (options.out !== undefined && options.out.trim() !== "") {
    const normalized = normalizeBundleOutputPath(options.out);
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
      const label = runIds.length === 1 ? runIds[0]! : `multi-${runIds.length}`;
      return resolveInsideWorkspace(
        location.workspaceDir,
        path.join(manifest.manifest.bundlesDir, `bundle-${label}-${stamp}`),
      );
    }
  } catch {
    // fall through
  }

  return defaultBundleOutputPath(runIds);
}

async function writeBundleFile(
  outputDir: string,
  relativePath: string,
  content: string,
  files: string[],
): Promise<void> {
  const outPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, content, "utf-8");
  files.push(relativePath);
}

function renderBundleIndexHtml(parts: {
  runIds: readonly string[];
  reports: ReadonlyMap<string, string>;
}): string {
  const links = parts.runIds
    .map(
      (runId) =>
        `<li><a href="assets/runs/${escapeHtml(runId)}.html">${escapeHtml(runId)}</a></li>`,
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
  const profile = parseBundleProfile(options.profile);
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

  const outputDir = await resolveOutputDir(options, resolveResult.runIds, cwd);
  const files: string[] = [];
  const checkRuns: BundleCheckResults["runs"] = [];
  const redactionRuns: BundleRedactionReport["runs"] = [];
  const htmlByRun = new Map<string, string>();
  const redactedJsonlByRun = new Map<string, string>();
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

    const safety = assessOpenedTrace(read, { run: runId });
    const status = safetyStatusFromAssess(safety.status);
    checkRuns.push({
      runId,
      status,
      errors: safety.summary.errors,
      warnings: safety.summary.warnings,
      findings: safety.summary.findings,
    });

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
          error: `Bundle safety status is ${checks.aggregateStatus}. Pass --allow-unsafe to override.`,
          checks,
        }).trimEnd(),
      );
    } else {
      console.error(
        `[AgentInspect] bundle refused: safety status is ${checks.aggregateStatus}. Pass --allow-unsafe to override.`,
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

  await mkdir(outputDir, { recursive: true });

  for (const runId of resolveResult.runIds) {
    const jsonl = redactedJsonlByRun.get(runId) ?? "";
    await writeBundleFile(outputDir, `assets/runs/${runId}.jsonl`, jsonl, files);
    const html = htmlByRun.get(runId) ?? "";
    await writeBundleFile(
      outputDir,
      `assets/runs/${runId}.html`,
      runReportWrap(html, runId),
      files,
    );
  }

  const primaryRunId = resolveResult.runIds[0]!;
  const traceHtml =
    resolveResult.runIds.length === 1
      ? runReportWrap(htmlByRun.get(primaryRunId) ?? "", primaryRunId)
      : renderBundleIndexHtml({ runIds: resolveResult.runIds, reports: htmlByRun });

  await writeBundleFile(outputDir, "trace.jsonl", combinedJsonl, files);
  await writeBundleFile(outputDir, "trace.html", traceHtml, files);
  await writeBundleFile(
    outputDir,
    "check-results.json",
    writeJson(checks),
    files,
  );
  await writeBundleFile(
    outputDir,
    "eval-results.json",
    writeJson(buildPlaceholderArtifact()),
    files,
  );
  await writeBundleFile(
    outputDir,
    "redaction-report.json",
    writeJson(redactionReport),
    files,
  );
  await writeBundleFile(
    outputDir,
    "performance-summary.json",
    writeJson(buildPlaceholderArtifact()),
    files,
  );

  const metadata = buildBundleMetadata({
    agentInspectVersion: packageVersion,
    profile,
    resolve: resolveResult,
    checks,
    files: [...files],
  });

  await writeBundleFile(outputDir, "metadata.json", writeJson(metadata), files);
  await writeBundleFile(
    outputDir,
    "summary.md",
    buildBundleSummaryMarkdown({ metadata, checks, redaction: redactionReport }),
    files,
  );

  metadata.files = [...files].sort((a, b) => a.localeCompare(b));
  await writeFile(path.join(outputDir, "metadata.json"), writeJson(metadata), "utf-8");

  if (options.json) {
    console.log(
      writeJson({
        ok: true,
        outputDir,
        metadata,
        checks,
        redaction: redactionReport,
      }).trimEnd(),
    );
    return;
  }

  console.log(`Bundle written to ${outputDir}`);
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
