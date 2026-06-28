import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  validateReporterArtifactPath,
  type TraceArtifact,
  type TraceReporterFramework,
  type TraceTestStatus,
} from "@agent-inspect/core/reporters";

export interface CiSummaryCommandOptions {
  output?: string;
  githubSummary?: string;
  json?: boolean;
}

interface ReporterManifestDocument {
  packageName?: string;
  manifest: NormalizedReporterManifest;
  diagnostics: number;
}

interface NormalizedReporterManifest {
  framework: TraceReporterFramework;
  generatedAt: string;
  results: CiSummaryTestResult[];
  artifacts: CiSummaryArtifact[];
}

interface CiSummaryManifest {
  packageName?: string;
  manifestFile: string;
  framework: TraceReporterFramework;
  generatedAt: string;
  results: CiSummaryTestResult[];
  artifacts: CiSummaryArtifact[];
  diagnostics: number;
}

interface CiSummaryTestResult {
  testId: string;
  name: string;
  file?: string;
  status: TraceTestStatus;
  tracePath?: string;
  artifacts: CiSummaryArtifact[];
  diagnostics: number;
}

interface CiSummaryArtifact {
  kind: TraceArtifact["kind"];
  path: string;
  format: TraceArtifact["format"];
  redactionProfile: TraceArtifact["redactionProfile"];
}

interface CiSummaryResult {
  status: "ok" | "failed" | "warning";
  manifests: CiSummaryManifest[];
  summary: {
    manifests: number;
    tests: number;
    failed: number;
    passed: number;
    skipped: number;
    todo: number;
    artifacts: number;
    diagnostics: number;
  };
  note: string;
}

const NOTE =
  "Generated locally by AgentInspect from reporter artifact manifests. Trace contents are not embedded.";
const MAX_TEXT = 180;
const FRAMEWORKS = new Set(["vitest", "jest", "manual"]);
const STATUSES = new Set(["passed", "failed", "skipped", "todo"]);
const ARTIFACT_KINDS = new Set(["trace", "report", "eval", "redaction", "summary"]);
const ARTIFACT_FORMATS = new Set(["json", "jsonl", "md", "html"]);
const REDACTION_PROFILES = new Set(["local", "share", "strict"]);

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return safeText(value);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? safeText(value) : undefined;
}

function readFramework(value: unknown): TraceReporterFramework {
  const framework = readString(value, "manifest.framework");
  if (!FRAMEWORKS.has(framework)) {
    throw new Error(`Unsupported reporter framework: ${framework}.`);
  }
  return framework as TraceReporterFramework;
}

function readStatus(value: unknown): TraceTestStatus {
  const status = readString(value, "result.status");
  if (!STATUSES.has(status)) {
    throw new Error(`Unsupported reporter test status: ${status}.`);
  }
  return status as TraceTestStatus;
}

function readArtifact(value: unknown, index: number): CiSummaryArtifact {
  if (!isObject(value)) throw new Error(`manifest.artifacts[${index}] must be an object.`);
  const kind = readString(value.kind, `manifest.artifacts[${index}].kind`);
  const format = readString(value.format, `manifest.artifacts[${index}].format`);
  const redactionProfile = readString(
    value.redactionProfile,
    `manifest.artifacts[${index}].redactionProfile`,
  );
  if (!ARTIFACT_KINDS.has(kind)) throw new Error(`Unsupported artifact kind: ${kind}.`);
  if (!ARTIFACT_FORMATS.has(format)) throw new Error(`Unsupported artifact format: ${format}.`);
  if (!REDACTION_PROFILES.has(redactionProfile)) {
    throw new Error(`Unsupported artifact redaction profile: ${redactionProfile}.`);
  }
  const artifactPath = readString(value.path, `manifest.artifacts[${index}].path`);
  const pathCheck = validateReporterArtifactPath({
    outputDir: process.cwd(),
    relativePath: artifactPath,
  });
  if (!pathCheck.ok || pathCheck.relativePath === undefined) {
    throw new Error(`Unsafe reporter artifact path: ${artifactPath}.`);
  }
  return {
    kind: kind as TraceArtifact["kind"],
    path: pathCheck.relativePath,
    format: format as TraceArtifact["format"],
    redactionProfile: redactionProfile as TraceArtifact["redactionProfile"],
  };
}

function readArtifacts(value: unknown, label: string): CiSummaryArtifact[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((item, index) => readArtifact(item, index));
}

function readDiagnosticsCount(value: unknown, label: string): number {
  if (value === undefined) return 0;
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.length;
}

function readResult(value: unknown, index: number): CiSummaryTestResult {
  if (!isObject(value)) throw new Error(`manifest.results[${index}] must be an object.`);
  const file = readOptionalString(value.file);
  const tracePath = readOptionalString(value.tracePath);
  return {
    testId: readString(value.testId, `manifest.results[${index}].testId`),
    name: readString(value.name, `manifest.results[${index}].name`),
    ...(file === undefined ? {} : { file }),
    status: readStatus(value.status),
    ...(tracePath === undefined ? {} : { tracePath }),
    artifacts: readArtifacts(value.artifacts, `manifest.results[${index}].artifacts`),
    diagnostics: readDiagnosticsCount(
      value.diagnostics,
      `manifest.results[${index}].diagnostics`,
    ),
  };
}

function readManifestDocument(value: unknown): ReporterManifestDocument {
  if (!isObject(value)) throw new Error("Reporter manifest file must contain a JSON object.");
  const candidate = isObject(value.manifest) ? value.manifest : value;
  if (!isObject(candidate)) throw new Error("Reporter manifest must be a JSON object.");
  const schemaVersion = readString(candidate.schemaVersion, "manifest.schemaVersion");
  if (schemaVersion !== "0.1") {
    throw new Error(`Unsupported reporter manifest schemaVersion: ${schemaVersion}.`);
  }
  if (!Array.isArray(candidate.results)) {
    throw new Error("manifest.results must be an array.");
  }
  const artifacts = readArtifacts(candidate.artifacts, "manifest.artifacts");
  const results = candidate.results.map((item, index) => readResult(item, index));
  const diagnostics = readDiagnosticsCount(candidate.diagnostics, "manifest.diagnostics");
  const manifest: NormalizedReporterManifest = {
    framework: readFramework(candidate.framework),
    generatedAt: readString(candidate.generatedAt, "manifest.generatedAt"),
    results,
    artifacts,
  };
  return {
    packageName: readOptionalString(value.package),
    manifest,
    diagnostics,
  };
}

function cwdRelative(filePath: string): string {
  const relative = path.relative(process.cwd(), path.resolve(filePath)).replace(/\\/g, "/");
  if (relative === "" || relative.startsWith("../") || path.isAbsolute(relative)) {
    return path.basename(filePath);
  }
  return relative;
}

async function readReporterManifest(filePath: string): Promise<CiSummaryManifest> {
  const absolute = path.resolve(filePath);
  const raw = await readFile(absolute, "utf-8");
  const document = readManifestDocument(JSON.parse(raw));
  const manifest = document.manifest;
  const results = manifest.results.map((result) => ({
    testId: safeText(result.testId),
    name: safeText(result.name),
    ...(result.file === undefined ? {} : { file: safeText(path.basename(result.file)) }),
    status: result.status,
    ...(result.tracePath === undefined ? {} : { tracePath: safeText(path.basename(result.tracePath)) }),
    artifacts: result.artifacts,
    diagnostics: result.diagnostics,
  }));
  return {
    ...(document.packageName === undefined ? {} : { packageName: document.packageName }),
    manifestFile: cwdRelative(absolute),
    framework: manifest.framework,
    generatedAt: manifest.generatedAt,
    results,
    artifacts: manifest.artifacts,
    diagnostics: document.diagnostics,
  };
}

function summarize(manifests: CiSummaryManifest[]): CiSummaryResult {
  const summary = {
    manifests: manifests.length,
    tests: 0,
    failed: 0,
    passed: 0,
    skipped: 0,
    todo: 0,
    artifacts: 0,
    diagnostics: 0,
  };
  for (const manifest of manifests) {
    summary.artifacts += manifest.artifacts.length;
    summary.diagnostics += manifest.diagnostics;
    for (const result of manifest.results) {
      summary.tests += 1;
      if (result.status === "failed") summary.failed += 1;
      else if (result.status === "passed") summary.passed += 1;
      else if (result.status === "skipped") summary.skipped += 1;
      else summary.todo += 1;
      summary.artifacts += result.artifacts.length;
      summary.diagnostics += result.diagnostics;
    }
  }
  return {
    status: summary.failed > 0 ? "failed" : summary.diagnostics > 0 ? "warning" : "ok",
    manifests,
    summary,
    note: NOTE,
  };
}

function markdownCell(value: string | number | undefined): string {
  return safeText(String(value ?? "unknown"))
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, " ");
}

function renderMarkdown(result: CiSummaryResult): string {
  const lines = [
    "# AgentInspect CI Summary",
    "",
    NOTE,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Status | ${result.status} |`,
    `| Manifests | ${result.summary.manifests} |`,
    `| Tests | ${result.summary.tests} |`,
    `| Failed | ${result.summary.failed} |`,
    `| Passed | ${result.summary.passed} |`,
    `| Skipped | ${result.summary.skipped} |`,
    `| Todo | ${result.summary.todo} |`,
    `| Artifacts | ${result.summary.artifacts} |`,
    `| Diagnostics | ${result.summary.diagnostics} |`,
    "",
    "## Tests",
    "",
    "| Framework | Status | Test | File | Trace | Artifacts |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  const rows = result.manifests.flatMap((manifest) =>
    manifest.results.map((test) => ({
      framework: manifest.framework,
      test,
    })),
  );
  if (rows.length === 0) {
    lines.push("| unknown | unknown | No tests found | unknown | unknown | 0 |");
  } else {
    for (const row of rows) {
      lines.push(
        `| ${markdownCell(row.framework)} | ${markdownCell(row.test.status)} | ${markdownCell(row.test.name)} | ${markdownCell(row.test.file)} | ${markdownCell(row.test.tracePath)} | ${row.test.artifacts.length} |`,
      );
    }
  }
  lines.push("", "## Manifests", "", "| Framework | File | Generated | Artifacts |", "| --- | --- | --- | --- |");
  for (const manifest of result.manifests) {
    lines.push(
      `| ${markdownCell(manifest.framework)} | ${markdownCell(manifest.manifestFile)} | ${markdownCell(manifest.generatedAt)} | ${manifest.artifacts.length} |`,
    );
  }
  lines.push("", "## Artifacts", "", "| Framework | Kind | Path | Format | Profile |", "| --- | --- | --- | --- | --- |");
  const artifacts = result.manifests.flatMap((manifest) =>
    manifest.artifacts.map((artifact) => ({ framework: manifest.framework, artifact })),
  );
  if (artifacts.length === 0) {
    lines.push("| unknown | unknown | No artifacts found | unknown | unknown |");
  } else {
    for (const row of artifacts) {
      lines.push(
        `| ${markdownCell(row.framework)} | ${markdownCell(row.artifact.kind)} | ${markdownCell(row.artifact.path)} | ${markdownCell(row.artifact.format)} | ${markdownCell(row.artifact.redactionProfile)} |`,
      );
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function safeText(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  const redacted = compact
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .replace(
      /\b(?:api[_-]?key|authorization|token|secret|password)\s*[:=]\s*[^,\s]+/gi,
      "$1=[REDACTED]",
    );
  if (redacted.length <= MAX_TEXT) return redacted;
  return `${redacted.slice(0, MAX_TEXT - 12)}...[truncated]`;
}

export async function ciSummaryCommand(
  manifestPaths: string[],
  options: CiSummaryCommandOptions = {},
): Promise<void> {
  if (manifestPaths.length === 0) {
    console.error("At least one reporter manifest path is required.");
    process.exitCode = 1;
    return;
  }

  let result: CiSummaryResult;
  try {
    const manifests = [];
    for (const manifestPath of manifestPaths) {
      manifests.push(await readReporterManifest(manifestPath));
    }
    manifests.sort((a, b) => a.manifestFile.localeCompare(b.manifestFile));
    result = summarize(manifests);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[AgentInspect] ci-summary failed: ${message}`);
    process.exitCode = 1;
    return;
  }

  const markdown = renderMarkdown(result);
  const outputPath =
    options.output !== undefined && options.output.trim() !== ""
      ? path.resolve(options.output.trim())
      : undefined;
  if (outputPath !== undefined) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, markdown, "utf-8");
  }

  const summaryTarget = options.githubSummary ?? process.env.GITHUB_STEP_SUMMARY;
  if (summaryTarget !== undefined && summaryTarget.trim() !== "") {
    const summaryPath = path.resolve(summaryTarget);
    await mkdir(path.dirname(summaryPath), { recursive: true });
    await appendFile(summaryPath, `\n${markdown}`, "utf-8");
  }

  if (options.json === true) {
    console.log(writeJson(result).trimEnd());
  } else if (outputPath !== undefined) {
    console.log(`Wrote AgentInspect CI summary to ${outputPath}`);
    console.log(`Status: ${result.status}`);
  } else {
    console.log(markdown.trimEnd());
  }
}
