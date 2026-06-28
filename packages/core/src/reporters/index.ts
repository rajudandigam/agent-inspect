import path from "node:path";

export const TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION = "0.1" as const;

/** Experimental reporter framework identifier for local CI artifacts. */
export type TraceReporterFramework = "vitest" | "jest" | "manual";

/** Experimental reporter test status normalized across supported test runners. */
export type TraceTestStatus = "passed" | "failed" | "skipped" | "todo";

/** Experimental reporter artifact kind used in artifact manifests. */
export type TraceArtifactKind = "trace" | "report" | "eval" | "redaction" | "summary";

/** Experimental reporter artifact file format used in artifact manifests. */
export type TraceArtifactFormat = "json" | "jsonl" | "md" | "html";

/** Experimental redaction profile marker recorded with reporter artifacts. */
export type TraceArtifactRedactionProfile = "local" | "share" | "strict";

/** Experimental reporter diagnostic severity. */
export type TraceReporterDiagnosticSeverity = "info" | "warning" | "error";

/** Experimental reporter diagnostic code for safe, non-throwing reporter helpers. */
export type TraceReporterDiagnosticCode =
  | "invalid_artifact_path"
  | "artifact_path_escape"
  | "artifact_path_empty"
  | "artifact_path_absolute"
  | "reporter_failure";

/** Experimental diagnostic emitted by reporter helpers instead of throwing. */
export interface TraceReporterDiagnostic {
  code: TraceReporterDiagnosticCode;
  severity: TraceReporterDiagnosticSeverity;
  message: string;
  target?: string;
}

/** Experimental manifest artifact entry shared by framework reporters. */
export interface TraceArtifact {
  kind: TraceArtifactKind;
  path: string;
  format: TraceArtifactFormat;
  redactionProfile: TraceArtifactRedactionProfile;
  title?: string;
  sizeBytes?: number;
  diagnostics?: TraceReporterDiagnostic[];
}

/** Experimental normalized test result entry shared by framework reporters. */
export interface TraceTestResult {
  testId: string;
  name: string;
  file?: string;
  status: TraceTestStatus;
  durationMs?: number;
  tracePath?: string;
  artifacts?: TraceArtifact[];
  diagnostics?: TraceReporterDiagnostic[];
}

/** Experimental reporter artifact manifest shared by framework reporters. */
export interface TraceArtifactManifest {
  schemaVersion: typeof TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION;
  generatedAt: string;
  framework: TraceReporterFramework;
  results: TraceTestResult[];
  artifacts: TraceArtifact[];
  diagnostics: TraceReporterDiagnostic[];
}

/** Experimental options for deterministic reporter artifact manifest creation. */
export interface CreateTraceArtifactManifestOptions {
  framework: TraceReporterFramework;
  generatedAt: string;
  results: TraceTestResult[];
  artifacts?: TraceArtifact[];
  diagnostics?: TraceReporterDiagnostic[];
}

/** Experimental options for deriving a safe reporter artifact path. */
export interface CreateReporterArtifactPathOptions {
  outputDir: string;
  testId: string;
  name: string;
  kind: TraceArtifactKind;
  format: TraceArtifactFormat;
  file?: string;
}

/** Experimental result from reporter artifact path validation/resolution. */
export interface ReporterArtifactPathResult {
  ok: boolean;
  outputDir: string;
  relativePath?: string;
  absolutePath?: string;
  diagnostics: TraceReporterDiagnostic[];
}

export interface ValidateReporterArtifactPathOptions {
  outputDir: string;
  relativePath: string;
}

const FORMAT_EXTENSIONS: Record<TraceArtifactFormat, string> = {
  json: "json",
  jsonl: "jsonl",
  md: "md",
  html: "html",
};

function sortDiagnostics(a: TraceReporterDiagnostic, b: TraceReporterDiagnostic): number {
  return compareStrings(a.target ?? "", b.target ?? "") ||
    compareStrings(a.code, b.code) ||
    compareStrings(a.severity, b.severity) ||
    compareStrings(a.message, b.message);
}

function sortArtifacts(a: TraceArtifact, b: TraceArtifact): number {
  return compareStrings(a.path, b.path) ||
    compareStrings(a.kind, b.kind) ||
    compareStrings(a.format, b.format) ||
    compareStrings(a.redactionProfile, b.redactionProfile) ||
    compareStrings(a.title ?? "", b.title ?? "");
}

function sortResults(a: TraceTestResult, b: TraceTestResult): number {
  return compareStrings(a.file ?? "", b.file ?? "") ||
    compareStrings(a.name, b.name) ||
    compareStrings(a.testId, b.testId);
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cloneDiagnostic(diagnostic: TraceReporterDiagnostic): TraceReporterDiagnostic {
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    ...(diagnostic.target === undefined ? {} : { target: diagnostic.target }),
  };
}

function cloneArtifact(artifact: TraceArtifact): TraceArtifact {
  return {
    kind: artifact.kind,
    path: artifact.path,
    format: artifact.format,
    redactionProfile: artifact.redactionProfile,
    ...(artifact.title === undefined ? {} : { title: artifact.title }),
    ...(artifact.sizeBytes === undefined ? {} : { sizeBytes: artifact.sizeBytes }),
    diagnostics: (artifact.diagnostics ?? []).map(cloneDiagnostic).sort(sortDiagnostics),
  };
}

function cloneResult(result: TraceTestResult): TraceTestResult {
  return {
    testId: result.testId,
    name: result.name,
    ...(result.file === undefined ? {} : { file: result.file }),
    status: result.status,
    ...(result.durationMs === undefined ? {} : { durationMs: result.durationMs }),
    ...(result.tracePath === undefined ? {} : { tracePath: result.tracePath }),
    artifacts: (result.artifacts ?? []).map(cloneArtifact).sort(sortArtifacts),
    diagnostics: (result.diagnostics ?? []).map(cloneDiagnostic).sort(sortDiagnostics),
  };
}

function artifactIdentity(artifact: TraceArtifact): string {
  return `${artifact.path}\0${artifact.kind}\0${artifact.format}\0${artifact.redactionProfile}`;
}

function dedupeArtifacts(artifacts: TraceArtifact[]): TraceArtifact[] {
  const seen = new Set<string>();
  const out: TraceArtifact[] = [];
  for (const artifact of artifacts.sort(sortArtifacts)) {
    const key = artifactIdentity(artifact);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(artifact);
  }
  return out;
}

/** Experimental helper that creates a deterministic reporter artifact manifest. */
export function createTraceArtifactManifest(
  options: CreateTraceArtifactManifestOptions,
): TraceArtifactManifest {
  const results = options.results.map(cloneResult).sort(sortResults);
  const resultArtifacts = results.flatMap((result) => result.artifacts ?? []);
  const artifacts = dedupeArtifacts([
    ...resultArtifacts,
    ...(options.artifacts ?? []).map(cloneArtifact),
  ]);

  return {
    schemaVersion: TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION,
    generatedAt: options.generatedAt,
    framework: options.framework,
    results,
    artifacts,
    diagnostics: (options.diagnostics ?? []).map(cloneDiagnostic).sort(sortDiagnostics),
  };
}

/** Experimental helper that creates a safe, deterministic artifact path for a test. */
export function createReporterArtifactPath(
  options: CreateReporterArtifactPathOptions,
): ReporterArtifactPathResult {
  const fileSlug = slugForPathLabel(options.file ?? "manual");
  const testSlug = slugForPathLabel(`${options.name}-${options.testId}`);
  const relativePath = path.posix.join(
    "tests",
    fileSlug,
    testSlug,
    `${options.kind}.${FORMAT_EXTENSIONS[options.format]}`,
  );

  return validateReporterArtifactPath({
    outputDir: options.outputDir,
    relativePath,
  });
}

/** Experimental helper that validates an artifact path stays inside outputDir. */
export function validateReporterArtifactPath(
  options: ValidateReporterArtifactPathOptions,
): ReporterArtifactPathResult {
  const outputDir = path.resolve(options.outputDir);
  const diagnostics: TraceReporterDiagnostic[] = [];
  const rawPath = options.relativePath;

  if (rawPath.length === 0) {
    diagnostics.push({
      code: "artifact_path_empty",
      severity: "error",
      message: "Reporter artifact path must not be empty.",
    });
    return { ok: false, outputDir, diagnostics };
  }

  if (rawPath.includes("\0")) {
    diagnostics.push({
      code: "invalid_artifact_path",
      severity: "error",
      message: "Reporter artifact path must not contain null bytes.",
      target: rawPath,
    });
    return { ok: false, outputDir, diagnostics };
  }

  if (path.isAbsolute(rawPath) || path.win32.isAbsolute(rawPath)) {
    diagnostics.push({
      code: "artifact_path_absolute",
      severity: "error",
      message: "Reporter artifact path must be relative.",
      target: rawPath,
    });
    return { ok: false, outputDir, diagnostics };
  }

  const normalized = path.posix.normalize(rawPath.replace(/\\/g, "/"));
  const segments = normalized.split("/");
  if (
    normalized === "." ||
    normalized.startsWith("../") ||
    segments.some((segment) => segment === "..")
  ) {
    diagnostics.push({
      code: "artifact_path_escape",
      severity: "error",
      message: "Reporter artifact path must stay under the output directory.",
      target: rawPath,
    });
    return { ok: false, outputDir, diagnostics };
  }

  const absolutePath = path.resolve(outputDir, normalized);
  const relFromOutput = path.relative(outputDir, absolutePath);
  if (
    relFromOutput.length === 0 ||
    relFromOutput.startsWith("..") ||
    path.isAbsolute(relFromOutput)
  ) {
    diagnostics.push({
      code: "artifact_path_escape",
      severity: "error",
      message: "Reporter artifact path resolved outside the output directory.",
      target: rawPath,
    });
    return { ok: false, outputDir, diagnostics };
  }

  return {
    ok: true,
    outputDir,
    relativePath: normalized,
    absolutePath,
    diagnostics,
  };
}

/** Experimental helper that converts an unknown reporter failure into a diagnostic. */
export function createReporterFailureDiagnostic(
  error: unknown,
  target?: string,
): TraceReporterDiagnostic {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "Unknown reporter failure.";

  return {
    code: "reporter_failure",
    severity: "error",
    message,
    ...(target === undefined ? {} : { target }),
  };
}

function slugForPathLabel(value: string): string {
  const base = path.basename(value)
    .replace(/\.(test|spec)\.[^.]+$/, "")
    .replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "artifact";
}
