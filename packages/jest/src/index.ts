import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type AgentInspectJestStatus = "failed" | "passed" | "skipped";

/**
 * Experimental trace association read by `@agent-inspect/jest`.
 *
 * Jest does not expose Vitest-style task metadata, so the default path is an
 * explicit `associations` map keyed by test identity, or a `resolveTrace`
 * callback. The reporter never guesses by timestamps.
 */
export interface AgentInspectJestTraceAssociation {
  /** AgentInspect run/span identifier to show in safe artifacts. */
  readonly runId?: string;
  /** Local trace file path. Only the basename is written to artifacts. */
  readonly tracePath?: string;
  /** Optional stable label for the artifact directory. */
  readonly artifactLabel?: string;
}

/**
 * Experimental normalized view of one Jest assertion result.
 */
export interface AgentInspectJestTestCase {
  readonly id: string;
  readonly title: string;
  readonly fullName: string;
  readonly file?: string;
  readonly status: AgentInspectJestStatus;
  readonly raw: unknown;
}

/**
 * Experimental diagnostic emitted when reporter work cannot be completed.
 *
 * Diagnostics are reported instead of thrown so Jest's original test result
 * remains authoritative.
 */
export interface AgentInspectJestDiagnostic {
  readonly code:
    | "artifact-write-failed"
    | "github-summary-write-failed"
    | "on-diagnostic-failed";
  readonly message: string;
  readonly testId?: string;
}

/**
 * Experimental options for the AgentInspect Jest reporter.
 *
 * The reporter is local-only: it performs no network I/O and writes bounded,
 * structural artifacts without reading trace contents.
 */
export interface AgentInspectJestReporterOptions {
  /** Directory for safe Jest artifacts. Defaults to `.agent-inspect/jest-artifacts`. */
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
  /** Explicit trace associations keyed by `file::fullName`, `basename::fullName`, or `fullName`. */
  readonly associations?: Record<string, AgentInspectJestTraceAssociation>;
  /** Resolve explicit test-to-trace associations from a normalized Jest case. */
  readonly resolveTrace?: (
    test: AgentInspectJestTestCase,
  ) => AgentInspectJestTraceAssociation | undefined;
  /** Observe non-fatal reporter diagnostics. */
  readonly onDiagnostic?: (diagnostic: AgentInspectJestDiagnostic) => void;
}

export interface AgentInspectJestArtifact {
  readonly directory: string;
  readonly manifestPath: string;
  readonly summaryPath: string;
  readonly status: AgentInspectJestStatus;
  readonly testId: string;
}

/**
 * Experimental Jest reporter facade.
 *
 * The hooks mirror Jest reporter lifecycle names, while inputs stay structural
 * to avoid a runtime dependency on Jest internals.
 */
export interface AgentInspectJestReporterFacade {
  onTestResult(test: unknown, testResult: unknown, aggregatedResult?: unknown): Promise<void>;
  onRunComplete(contexts?: unknown, results?: unknown): Promise<void>;
  getDiagnostics(): readonly AgentInspectJestDiagnostic[];
  getArtifacts(): readonly AgentInspectJestArtifact[];
}

type AssertionResultLike = {
  readonly ancestorTitles?: unknown;
  readonly title?: unknown;
  readonly fullName?: unknown;
  readonly status?: unknown;
  readonly meta?: unknown;
  readonly agentInspect?: unknown;
};

type TestFileResultLike = {
  readonly testFilePath?: unknown;
  readonly testResults?: unknown;
  readonly assertionResults?: unknown;
};

const PACKAGE_NAME = "@agent-inspect/jest";
const ARTIFACT_SCHEMA_VERSION = "agent-inspect.jest-artifact.v1";
const DEFAULT_ARTIFACT_DIR = ".agent-inspect/jest-artifacts";
const DEFAULT_SUCCESS_LIMIT = 20;
const MAX_SUCCESS_LIMIT = 100;
const MAX_TEXT = 180;

/**
 * Create the experimental AgentInspect Jest reporter.
 */
export function createAgentInspectJestReporter(
  options: AgentInspectJestReporterOptions = {},
): AgentInspectJestReporterFacade {
  const diagnostics: AgentInspectJestDiagnostic[] = [];
  const artifacts: AgentInspectJestArtifact[] = [];
  const seenKeys = new Set<string>();
  const artifactNames = new Map<string, number>();
  const successLimit = normalizeSuccessLimit(options);
  let retainedSuccesses = 0;

  const reporter: AgentInspectJestReporterFacade = {
    async onTestResult(_test: unknown, testResult: unknown): Promise<void> {
      await handleFileResult(testResult);
    },
    async onRunComplete(_contexts?: unknown, results?: unknown): Promise<void> {
      for (const fileResult of readRunResults(results)) {
        await handleFileResult(fileResult);
      }
      await appendGithubSummary();
    },
    getDiagnostics(): readonly AgentInspectJestDiagnostic[] {
      return diagnostics.slice();
    },
    getArtifacts(): readonly AgentInspectJestArtifact[] {
      return artifacts.slice();
    },
  };

  async function handleFileResult(testResult: unknown): Promise<void> {
    for (const testCase of readTestCases(testResult)) {
      await handleTestCase(testCase);
    }
  }

  async function handleTestCase(testCase: AgentInspectJestTestCase): Promise<void> {
    const seenKey = `${testCase.id}:${testCase.status}`;
    if (seenKeys.has(seenKey)) return;

    const association = resolveAssociation(testCase, options);
    if (association === undefined) return;

    if (testCase.status === "passed") {
      if (retainedSuccesses >= successLimit) return;
      retainedSuccesses += 1;
    }

    seenKeys.add(seenKey);

    try {
      const artifact = await writeSafeArtifact({
        artifactDir: options.artifactDir ?? DEFAULT_ARTIFACT_DIR,
        association,
        reserveArtifactName,
        status: testCase.status,
        testCase,
      });
      artifacts.push(artifact);
    } catch (error) {
      reportDiagnostic({
        code: "artifact-write-failed",
        message: `Could not write AgentInspect Jest artifact: ${errorMessage(error)}`,
        testId: testCase.id,
      });
    }
  }

  function reserveArtifactName(seed: string): string {
    const base = safeSegment(seed);
    const next = (artifactNames.get(base) ?? 0) + 1;
    artifactNames.set(base, next);
    return next === 1 ? base : `${base}-${next}`;
  }

  function reportDiagnostic(diagnostic: AgentInspectJestDiagnostic): void {
    diagnostics.push(diagnostic);
    if (options.onDiagnostic === undefined) return;
    try {
      options.onDiagnostic(diagnostic);
    } catch (error) {
      diagnostics.push({
        code: "on-diagnostic-failed",
        message: `AgentInspect Jest diagnostic callback failed: ${errorMessage(error)}`,
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
      "## AgentInspect Jest artifacts",
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
        message: `Could not append AgentInspect Jest summary: ${errorMessage(error)}`,
      });
    }
  }

  return reporter;
}

/**
 * Experimental Jest custom reporter class.
 */
export class AgentInspectJestReporter implements AgentInspectJestReporterFacade {
  private readonly reporter: AgentInspectJestReporterFacade;

  constructor(_globalConfig?: unknown, options: AgentInspectJestReporterOptions = {}) {
    this.reporter = createAgentInspectJestReporter(options);
  }

  async onTestResult(
    test: unknown,
    testResult: unknown,
    aggregatedResult?: unknown,
  ): Promise<void> {
    await this.reporter.onTestResult(test, testResult, aggregatedResult);
  }

  async onRunComplete(contexts?: unknown, results?: unknown): Promise<void> {
    await this.reporter.onRunComplete(contexts, results);
  }

  getDiagnostics(): readonly AgentInspectJestDiagnostic[] {
    return this.reporter.getDiagnostics();
  }

  getArtifacts(): readonly AgentInspectJestArtifact[] {
    return this.reporter.getArtifacts();
  }
}

export const agentInspectJestReporter = createAgentInspectJestReporter;
export default AgentInspectJestReporter;

function normalizeSuccessLimit(options: AgentInspectJestReporterOptions): number {
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
  testCase: AgentInspectJestTestCase,
  options: AgentInspectJestReporterOptions,
): AgentInspectJestTraceAssociation | undefined {
  const resolved = options.resolveTrace?.(testCase);
  if (isAssociation(resolved)) return resolved;

  const explicit = resolveFromAssociationMap(testCase, options.associations);
  if (explicit !== undefined) return explicit;

  return readAssociationFromAssertion(testCase.raw);
}

function resolveFromAssociationMap(
  testCase: AgentInspectJestTestCase,
  associations: Record<string, AgentInspectJestTraceAssociation> | undefined,
): AgentInspectJestTraceAssociation | undefined {
  if (associations === undefined) return undefined;
  const basename = testCase.file === undefined ? undefined : path.basename(testCase.file);
  const candidates = [
    testCase.id,
    testCase.fullName,
    basename === undefined ? undefined : `${basename}::${testCase.fullName}`,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && isAssociation(associations[candidate])) {
      return associations[candidate];
    }
  }
  return undefined;
}

function readAssociationFromAssertion(
  assertion: unknown,
): AgentInspectJestTraceAssociation | undefined {
  if (!isObject(assertion)) return undefined;
  const direct = readProp(assertion, "agentInspect");
  if (isAssociation(direct)) return direct;

  const meta = readProp(assertion, "meta");
  if (!isObject(meta)) return undefined;
  for (const candidate of [
    readProp(meta, "agentInspect"),
    readProp(meta, "agent-inspect"),
    readProp(meta, "trace"),
  ]) {
    if (isAssociation(candidate)) return candidate;
  }
  return undefined;
}

function isAssociation(
  value: unknown,
): value is AgentInspectJestTraceAssociation {
  if (!isObject(value)) return false;
  return (
    readOptionalString(value, "runId") !== undefined ||
    readOptionalString(value, "tracePath") !== undefined ||
    readOptionalString(value, "artifactLabel") !== undefined
  );
}

function readRunResults(results: unknown): unknown[] {
  if (!isObject(results)) return [];
  const testResults = readProp(results, "testResults");
  return Array.isArray(testResults) ? testResults : [];
}

function readTestCases(testResult: unknown): AgentInspectJestTestCase[] {
  if (!isObject(testResult)) return [];
  const result = testResult as TestFileResultLike;
  const file = readOptionalString(result, "testFilePath");
  const assertions = Array.isArray(result.testResults)
    ? result.testResults
    : Array.isArray(result.assertionResults)
      ? result.assertionResults
      : [];

  const cases: AgentInspectJestTestCase[] = [];
  for (const assertion of assertions) {
    if (!isObject(assertion)) continue;
    const status = readStatus(assertion);
    if (status === undefined || status === "skipped") continue;

    const title = readOptionalString(assertion, "title") ?? "unknown-test";
    const fullName = readFullName(assertion as AssertionResultLike, title);
    const id = `${file ?? "unknown-file"}::${fullName}`;
    cases.push({
      file,
      fullName: boundText(redactText(fullName)),
      id: boundText(redactText(id)),
      raw: assertion,
      status,
      title: boundText(redactText(title)),
    });
  }
  return cases;
}

function readFullName(assertion: AssertionResultLike, title: string): string {
  const explicit = readOptionalString(assertion, "fullName");
  if (explicit !== undefined) return explicit;

  const ancestors = Array.isArray(assertion.ancestorTitles)
    ? assertion.ancestorTitles.filter((item): item is string => typeof item === "string")
    : [];
  return [...ancestors, title].join(" ");
}

function readStatus(assertion: object): AgentInspectJestStatus | undefined {
  const raw = readOptionalString(assertion, "status");
  if (raw === undefined) return undefined;

  const normalized = raw.toLowerCase();
  if (normalized === "failed" || normalized === "fail") return "failed";
  if (normalized === "passed" || normalized === "pass") return "passed";
  if (
    normalized === "pending" ||
    normalized === "todo" ||
    normalized === "skipped" ||
    normalized === "skip" ||
    normalized === "disabled"
  ) {
    return "skipped";
  }
  return undefined;
}

async function writeSafeArtifact(input: {
  readonly artifactDir: string;
  readonly association: AgentInspectJestTraceAssociation;
  readonly reserveArtifactName: (seed: string) => string;
  readonly status: AgentInspectJestStatus;
  readonly testCase: AgentInspectJestTestCase;
}): Promise<AgentInspectJestArtifact> {
  const artifactSeed =
    input.association.artifactLabel ??
    input.testCase.id ??
    input.testCase.fullName ??
    input.status;
  const artifactName = input.reserveArtifactName(artifactSeed);
  const directory = path.join(input.artifactDir, artifactName);
  await mkdir(directory, { recursive: true });

  const traceFile =
    input.association.tracePath === undefined
      ? undefined
      : path.basename(input.association.tracePath);
  const manifest = {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    package: PACKAGE_NAME,
    test: {
      id: input.testCase.id,
      name: input.testCase.fullName,
      file: input.testCase.file === undefined ? undefined : path.basename(input.testCase.file),
      status: input.status,
    },
    trace: {
      runId: safeOptional(input.association.runId),
      file: safeOptional(traceFile),
    },
  };

  const manifestPath = path.join(directory, "manifest.json");
  const summaryPath = path.join(directory, "summary.md");

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(summaryPath, renderSummary(manifest), "utf-8");

  return {
    directory,
    manifestPath,
    status: input.status,
    summaryPath,
    testId: input.testCase.id,
  };
}

function renderSummary(manifest: {
  readonly test: {
    readonly id: string;
    readonly name: string;
    readonly file?: string;
    readonly status: string;
  };
  readonly trace: {
    readonly runId?: string;
    readonly file?: string;
  };
}): string {
  return [
    "# AgentInspect Jest Artifact",
    "",
    `- Test: ${manifest.test.name}`,
    `- Test id: ${manifest.test.id}`,
    `- Status: ${manifest.test.status}`,
    `- File: ${manifest.test.file ?? "unknown"}`,
    `- Trace run: ${manifest.trace.runId ?? "unknown"}`,
    `- Trace file: ${manifest.trace.file ?? "unknown"}`,
    "",
    "Trace contents are intentionally not embedded in this artifact.",
    "",
  ].join("\n");
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
