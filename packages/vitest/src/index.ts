import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createReporterArtifactPath,
  createTraceArtifactManifest,
  type TraceArtifact,
  type TraceArtifactManifest,
  type TraceArtifactRedactionProfile,
  type TraceReporterDiagnostic,
} from "agent-inspect/reporters";

export type AgentInspectVitestStatus = "failed" | "passed" | "skipped";

/**
 * Experimental trace association read by `@agent-inspect/vitest`.
 *
 * Attach this object to Vitest task metadata, or return it from
 * `resolveTrace`. Associations are explicit only; the reporter never guesses
 * by timestamps.
 */
export interface AgentInspectVitestTraceAssociation {
  /** AgentInspect run/span identifier to show in safe artifacts. */
  readonly runId?: string;
  /** Local trace file path. Only the basename is written to artifacts. */
  readonly tracePath?: string;
  /** Optional stable label for the artifact directory. */
  readonly artifactLabel?: string;
}

/**
 * Experimental diagnostic emitted when reporter work cannot be completed.
 *
 * Diagnostics are reported instead of throwing so Vitest's original test
 * result remains authoritative.
 */
export interface AgentInspectVitestDiagnostic {
  readonly code:
    | "artifact-write-failed"
    | "github-summary-write-failed"
    | "on-diagnostic-failed"
    | "unsafe-artifact-path";
  readonly message: string;
  readonly testId?: string;
}

/**
 * Experimental options for the AgentInspect Vitest reporter.
 *
 * The reporter is local-only: it performs no network I/O and writes bounded,
 * structural artifacts without reading trace contents.
 */
export interface AgentInspectVitestReporterOptions {
  /** Directory for safe Vitest artifacts. Defaults to `.agent-inspect/vitest-artifacts`. */
  readonly artifactDir?: string;
  /** Optional GitHub step-summary path. Only bounded structural lines are appended. */
  readonly githubSummary?: string;
  /**
   * Keep artifacts for passing tests. `false`/undefined keeps none; `true`
   * keeps up to `maxSuccessfulTraces`; a number keeps up to that many.
   */
  readonly retainSuccessful?: boolean | number;
  /** Upper bound for retained passing-test artifacts. Defaults to 20. */
  readonly maxSuccessfulTraces?: number;
  /** Redaction profile recorded on generated artifacts. Defaults to `share`. */
  readonly redactionProfile?: TraceArtifactRedactionProfile;
  /** Deterministic manifest timestamp. Defaults to the Unix epoch. */
  readonly generatedAt?: string;
  /** Resolve explicit test-to-trace associations from a Vitest task/result. */
  readonly resolveTrace?: (
    test: unknown,
  ) => AgentInspectVitestTraceAssociation | undefined;
  /** Observe non-fatal reporter diagnostics. */
  readonly onDiagnostic?: (diagnostic: AgentInspectVitestDiagnostic) => void;
}

export interface AgentInspectVitestArtifact {
  readonly directory: string;
  readonly manifestPath: string;
  readonly summaryPath: string;
  readonly status: AgentInspectVitestStatus;
  readonly testId: string;
  readonly manifest: TraceArtifactManifest;
}

/**
 * Experimental Vitest reporter facade.
 *
 * The shape is intentionally structural so the package stays tolerant of
 * Vitest reporter API drift while still exposing the hooks Vitest calls.
 */
export interface AgentInspectVitestReporter {
  onTestCaseResult(test: unknown): Promise<void>;
  onTaskUpdate(tasks: unknown): Promise<void>;
  onFinished(files?: unknown): Promise<void>;
  getDiagnostics(): readonly AgentInspectVitestDiagnostic[];
  getArtifacts(): readonly AgentInspectVitestArtifact[];
}

type TestIdentity = {
  readonly id: string;
  readonly name: string;
  readonly file?: string;
};

type TestLike = {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly suite?: unknown;
  readonly file?: unknown;
  readonly filepath?: unknown;
  readonly result?: unknown;
  readonly meta?: unknown;
  readonly context?: unknown;
  readonly tasks?: unknown;
  readonly children?: unknown;
};

type ResultLike = {
  readonly state?: unknown;
  readonly status?: unknown;
  readonly meta?: unknown;
};

const PACKAGE_NAME = "@agent-inspect/vitest";
const DEFAULT_ARTIFACT_DIR = ".agent-inspect/vitest-artifacts";
const DEFAULT_SUCCESS_LIMIT = 20;
const MAX_SUCCESS_LIMIT = 100;
const MAX_TEXT = 180;
const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

/**
 * Create the experimental AgentInspect Vitest reporter.
 */
export function createAgentInspectVitestReporter(
  options: AgentInspectVitestReporterOptions = {},
): AgentInspectVitestReporter {
  const diagnostics: AgentInspectVitestDiagnostic[] = [];
  const artifacts: AgentInspectVitestArtifact[] = [];
  const seenObjects = new WeakSet<object>();
  const seenKeys = new Set<string>();
  const artifactNames = new Map<string, number>();
  const successLimit = normalizeSuccessLimit(options);
  let retainedSuccesses = 0;

  const reporter: AgentInspectVitestReporter = {
    async onTestCaseResult(test: unknown): Promise<void> {
      await handleTest(test);
    },
    async onTaskUpdate(tasks: unknown): Promise<void> {
      for (const test of collectTasks(tasks)) {
        await handleTest(test);
      }
    },
    async onFinished(files?: unknown): Promise<void> {
      for (const test of collectTasks(files)) {
        await handleTest(test);
      }
      await appendGithubSummary();
    },
    getDiagnostics(): readonly AgentInspectVitestDiagnostic[] {
      return diagnostics.slice();
    },
    getArtifacts(): readonly AgentInspectVitestArtifact[] {
      return artifacts.slice();
    },
  };

  async function handleTest(test: unknown): Promise<void> {
    if (!isObject(test)) return;
    if (seenObjects.has(test)) return;

    const status = readStatus(test);
    if (status === undefined || status === "skipped") return;

    const identity = readIdentity(test);
    const seenKey = `${identity.id}:${status}`;
    if (seenKeys.has(seenKey)) return;

    const association = resolveAssociation(test, options);
    if (association === undefined) return;

    if (status === "passed") {
      if (retainedSuccesses >= successLimit) return;
      retainedSuccesses += 1;
    }

    seenObjects.add(test);
    seenKeys.add(seenKey);

    try {
      const artifact = await writeSafeArtifact({
        artifactDir: options.artifactDir ?? DEFAULT_ARTIFACT_DIR,
        association,
        generatedAt: options.generatedAt ?? DEFAULT_GENERATED_AT,
        identity,
        reserveArtifactName,
        redactionProfile: options.redactionProfile ?? "share",
        status,
      });
      artifacts.push(artifact);
    } catch (error) {
      reportDiagnostic({
        code: "artifact-write-failed",
        message: `Could not write AgentInspect Vitest artifact: ${errorMessage(error)}`,
        testId: identity.id,
      });
    }
  }

  function reserveArtifactName(seed: string): string {
    const base = safeSegment(seed);
    const next = (artifactNames.get(base) ?? 0) + 1;
    artifactNames.set(base, next);
    return next === 1 ? base : `${base}-${next}`;
  }

  function reportDiagnostic(diagnostic: AgentInspectVitestDiagnostic): void {
    diagnostics.push(diagnostic);
    if (options.onDiagnostic === undefined) return;
    try {
      options.onDiagnostic(diagnostic);
    } catch (error) {
      diagnostics.push({
        code: "on-diagnostic-failed",
        message: `AgentInspect Vitest diagnostic callback failed: ${errorMessage(error)}`,
        testId: diagnostic.testId,
      });
    }
  }

  async function appendGithubSummary(): Promise<void> {
    if (options.githubSummary === undefined || artifacts.length === 0) return;
    const failed = artifacts.filter((artifact) => artifact.status === "failed").length;
    const passed = artifacts.filter((artifact) => artifact.status === "passed").length;
    const lines = [
      "",
      "## AgentInspect Vitest artifacts",
      "",
      `- Failed test artifacts: ${failed}`,
      `- Passing test artifacts retained: ${passed}`,
      `- Artifact directory: ${boundText(path.basename(options.artifactDir ?? DEFAULT_ARTIFACT_DIR))}`,
      "",
    ];
    try {
      await writeFile(options.githubSummary, `${lines.join("\n")}\n`, { flag: "a" });
    } catch (error) {
      reportDiagnostic({
        code: "github-summary-write-failed",
        message: `Could not append AgentInspect Vitest summary: ${errorMessage(error)}`,
      });
    }
  }

  return reporter;
}

export const agentInspectVitestReporter = createAgentInspectVitestReporter;

function normalizeSuccessLimit(options: AgentInspectVitestReporterOptions): number {
  const cap = clampCount(options.maxSuccessfulTraces, DEFAULT_SUCCESS_LIMIT);
  if (options.retainSuccessful === true) return cap;
  if (typeof options.retainSuccessful === "number") {
    return Math.min(clampCount(options.retainSuccessful, 0), cap);
  }
  return 0;
}

function clampCount(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(MAX_SUCCESS_LIMIT, Math.floor(value)));
}

function resolveAssociation(
  test: object,
  options: AgentInspectVitestReporterOptions,
): AgentInspectVitestTraceAssociation | undefined {
  const resolved = options.resolveTrace?.(test);
  if (isAssociation(resolved)) return resolved;

  const task = test as TestLike;
  const result = isObject(task.result) ? (task.result as ResultLike) : undefined;
  return (
    readAssociationFromMeta(task.meta) ??
    readAssociationFromContext(task.context) ??
    readAssociationFromMeta(result?.meta)
  );
}

function readAssociationFromContext(
  context: unknown,
): AgentInspectVitestTraceAssociation | undefined {
  if (!isObject(context)) return undefined;
  const maybeMeta = readProp(context, "meta");
  return readAssociationFromMeta(maybeMeta);
}

function readAssociationFromMeta(
  meta: unknown,
): AgentInspectVitestTraceAssociation | undefined {
  if (!isObject(meta)) return undefined;
  const direct = readProp(meta, "agentInspect");
  const hyphenated = readProp(meta, "agent-inspect");
  const trace = readProp(meta, "trace");
  for (const candidate of [direct, hyphenated, trace]) {
    if (isAssociation(candidate)) return candidate;
  }
  return undefined;
}

function isAssociation(
  value: unknown,
): value is AgentInspectVitestTraceAssociation {
  if (!isObject(value)) return false;
  return (
    readOptionalString(value, "runId") !== undefined ||
    readOptionalString(value, "tracePath") !== undefined ||
    readOptionalString(value, "artifactLabel") !== undefined
  );
}

function readStatus(test: object): AgentInspectVitestStatus | undefined {
  const task = test as TestLike;
  const result = isObject(task.result) ? (task.result as ResultLike) : undefined;
  const raw =
    readOptionalString(result, "state") ??
    readOptionalString(result, "status") ??
    readOptionalString(test, "state") ??
    readOptionalString(test, "status");
  if (raw === undefined) return undefined;

  const normalized = raw.toLowerCase();
  if (normalized === "fail" || normalized === "failed") return "failed";
  if (normalized === "pass" || normalized === "passed") return "passed";
  if (normalized === "skip" || normalized === "skipped") return "skipped";
  return undefined;
}

function readIdentity(test: object): TestIdentity {
  const task = test as TestLike;
  const id = readOptionalString(test, "id") ?? readOptionalString(test, "taskId");
  const name =
    readOptionalString(test, "fullName") ??
    readOptionalString(test, "name") ??
    readOptionalString(task.suite, "name") ??
    id ??
    "unknown-test";
  const file =
    readOptionalString(test, "file") ??
    readOptionalString(test, "filepath") ??
    readOptionalString(task.suite, "file");
  return {
    file: file === undefined ? undefined : path.basename(file),
    id: boundText(redactText(id ?? name)),
    name: boundText(redactText(name)),
  };
}

async function writeSafeArtifact(input: {
  readonly artifactDir: string;
  readonly association: AgentInspectVitestTraceAssociation;
  readonly generatedAt: string;
  readonly identity: TestIdentity;
  readonly redactionProfile: TraceArtifactRedactionProfile;
  readonly reserveArtifactName: (seed: string) => string;
  readonly status: AgentInspectVitestStatus;
}): Promise<AgentInspectVitestArtifact> {
  const artifactSeed =
    input.association.artifactLabel ??
    input.identity.id ??
    input.identity.name ??
    input.status;
  const artifactName = input.reserveArtifactName(artifactSeed);
  const manifestPathResult = createReporterArtifactPath({
    outputDir: input.artifactDir,
    testId: artifactName,
    name: input.identity.name,
    file: input.identity.file,
    kind: "report",
    format: "json",
  });
  const summaryPathResult = createReporterArtifactPath({
    outputDir: input.artifactDir,
    testId: artifactName,
    name: input.identity.name,
    file: input.identity.file,
    kind: "summary",
    format: "md",
  });

  if (
    !manifestPathResult.ok ||
    manifestPathResult.absolutePath === undefined ||
    manifestPathResult.relativePath === undefined
  ) {
    throw new Error(formatPathDiagnostics(manifestPathResult.diagnostics));
  }
  if (
    !summaryPathResult.ok ||
    summaryPathResult.absolutePath === undefined ||
    summaryPathResult.relativePath === undefined
  ) {
    throw new Error(formatPathDiagnostics(summaryPathResult.diagnostics));
  }

  const directory = path.dirname(manifestPathResult.absolutePath);
  await mkdir(directory, { recursive: true });

  const traceFile =
    input.association.tracePath === undefined
      ? undefined
      : path.basename(input.association.tracePath);
  const manifestArtifact: TraceArtifact = {
    kind: "report",
    path: manifestPathResult.relativePath,
    format: "json",
    redactionProfile: input.redactionProfile,
  };
  const summaryArtifact: TraceArtifact = {
    kind: "summary",
    path: summaryPathResult.relativePath,
    format: "md",
    redactionProfile: input.redactionProfile,
  };
  const manifest = createTraceArtifactManifest({
    framework: "vitest",
    generatedAt: input.generatedAt,
    results: [
      {
        testId: input.identity.id,
        name: input.identity.name,
        ...(input.identity.file === undefined ? {} : { file: input.identity.file }),
        status: input.status,
        tracePath: safeOptional(traceFile),
        artifacts: [manifestArtifact, summaryArtifact],
        diagnostics: [],
      },
    ],
    artifacts: [manifestArtifact, summaryArtifact],
    diagnostics: [],
  });
  const trace = {
    runId: safeOptional(input.association.runId),
    file: safeOptional(traceFile),
  };

  await writeFile(
    manifestPathResult.absolutePath,
    `${JSON.stringify({ package: PACKAGE_NAME, manifest, trace }, null, 2)}\n`,
  );
  const summaryPath = summaryPathResult.absolutePath;
  await writeFile(summaryPath, renderSummary(manifest, trace), "utf-8");

  return {
    directory,
    manifest,
    manifestPath: manifestPathResult.absolutePath,
    status: input.status,
    summaryPath,
    testId: input.identity.id,
  };
}

function renderSummary(
  manifest: TraceArtifactManifest,
  trace: { readonly runId?: string; readonly file?: string },
): string {
  const result = manifest.results[0];
  return [
    "# AgentInspect Vitest Artifact",
    "",
    `- Test: ${result?.name ?? "unknown"}`,
    `- Test id: ${result?.testId ?? "unknown"}`,
    `- Status: ${result?.status ?? "unknown"}`,
    `- File: ${result?.file ?? "unknown"}`,
    `- Trace run: ${trace.runId ?? "unknown"}`,
    `- Trace file: ${result?.tracePath ?? "unknown"}`,
    `- Manifest schema: ${manifest.schemaVersion}`,
    "",
    "Trace contents are intentionally not embedded in this artifact.",
    "",
  ].join("\n");
}

function formatPathDiagnostics(
  diagnostics: readonly TraceReporterDiagnostic[],
): string {
  if (diagnostics.length === 0) return "Unsafe AgentInspect Vitest artifact path.";
  return diagnostics.map((diagnostic) => diagnostic.message).join("; ");
}

function* collectTasks(input: unknown, seen = new WeakSet<object>()): Iterable<unknown> {
  if (Array.isArray(input)) {
    for (const item of input) yield* collectTasks(item, seen);
    return;
  }
  if (!isObject(input) || seen.has(input)) return;

  seen.add(input);
  yield input;

  const task = input as TestLike;
  for (const childList of [task.tasks, task.children]) {
    if (Array.isArray(childList)) yield* collectTasks(childList, seen);
  }
}

function safeOptional(value: string | undefined): string | undefined {
  return value === undefined ? undefined : boundText(redactText(value));
}

function safeSegment(value: string): string {
  const sanitized = redactText(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return sanitized.length > 0 ? sanitized : "trace";
}

function boundText(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= MAX_TEXT) return compact;
  return `${compact.slice(0, MAX_TEXT - 12)}...[truncated]`;
}

function redactText(value: string): string {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .replace(/\b(?:api[_-]?key|authorization|token|secret|password)\s*[:=]\s*[^,\s]+/gi, "$1=[REDACTED]");
}

function readOptionalString(value: unknown, key: string): string | undefined {
  if (!isObject(value)) return undefined;
  const property = readProp(value, key);
  return typeof property === "string" && property.length > 0 ? property : undefined;
}

function readProp(value: object, key: string): unknown {
  return (value as Record<string, unknown>)[key];
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
