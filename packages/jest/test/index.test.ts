import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import type { TraceArtifactManifest } from "agent-inspect/reporters";

import {
  AgentInspectJestReporter,
  createAgentInspectJestReporter,
} from "../src/index.js";

type JestArtifactDocument = {
  readonly package: string;
  readonly manifest: TraceArtifactManifest;
  readonly trace: {
    readonly runId?: string;
    readonly file?: string;
  };
};

async function makeTmpDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "agent-inspect-jest-"));
}

function makeJestResult(input: {
  readonly testFilePath: string;
  readonly status: string;
  readonly title?: string;
  readonly fullName?: string;
  readonly meta?: unknown;
}) {
  return {
    testFilePath: input.testFilePath,
    testResults: [
      {
        ancestorTitles: ["agent suite"],
        fullName: input.fullName,
        meta: input.meta,
        status: input.status,
        title: input.title ?? "agent workflow",
      },
    ],
  };
}

describe("@agent-inspect/jest reporter", () => {
  it("writes a safe failure artifact from an explicit association map", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const tracePath = path.join(dir, "trace-with-secret.jsonl");
    await writeFile(
      tracePath,
      '{"input":"raw prompt","authorization":"Bearer sk-secret123456789"}\n',
    );

    const testFilePath = path.join(dir, "agent.test.cjs");
    const reporter = createAgentInspectJestReporter({
      artifactDir,
      associations: {
        [`${testFilePath}::agent suite agent workflow`]: {
          artifactLabel: "jest-agent",
          runId: "run-secret:sk-secret123456789",
          tracePath,
        },
      },
      generatedAt: "2026-06-28T00:00:00.000Z",
      redactionProfile: "strict",
    });

    await reporter.onTestResult(
      undefined,
      makeJestResult({ status: "failed", testFilePath }),
    );

    const artifacts = reporter.getArtifacts();
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]?.status).toBe("failed");
    expect(artifacts[0]?.testId).toBe("agent.test.cjs::agent suite agent workflow");

    const summary = await readFile(artifacts[0]!.summaryPath, "utf-8");
    const manifest = await readFile(artifacts[0]!.manifestPath, "utf-8");
    const combined = `${summary}\n${manifest}`;
    const document = JSON.parse(manifest) as JestArtifactDocument;

    expect(combined).toContain("agent suite agent workflow");
    expect(combined).toContain(path.basename(tracePath));
    expect(combined).not.toContain(tracePath);
    expect(combined).not.toContain(testFilePath);
    expect(combined).not.toContain("raw prompt");
    expect(combined).not.toContain("Bearer");
    expect(combined).not.toContain("sk-secret123456789");
    expect(combined).toContain("[REDACTED]");
    expect(document.package).toBe("@agent-inspect/jest");
    expect(document.manifest).toEqual(artifacts[0]?.manifest);
    expect(document.manifest.schemaVersion).toBe("0.1");
    expect(document.manifest.framework).toBe("jest");
    expect(document.manifest.generatedAt).toBe("2026-06-28T00:00:00.000Z");
    expect(document.manifest.results[0]).toMatchObject({
      testId: "agent.test.cjs::agent suite agent workflow",
      file: "agent.test.cjs",
      status: "failed",
      tracePath: "trace-with-secret.jsonl",
    });
    expect(document.manifest.artifacts).toEqual([
      {
        kind: "report",
        path: "tests/agent/agent-suite-agent-workflow-jest-agent/report.json",
        format: "json",
        redactionProfile: "strict",
        diagnostics: [],
      },
      {
        kind: "summary",
        path: "tests/agent/agent-suite-agent-workflow-jest-agent/summary.md",
        format: "md",
        redactionProfile: "strict",
        diagnostics: [],
      },
    ]);
    expect(summary).toContain("Manifest schema: 0.1");
  });

  it("requires explicit association and does not guess by timestamp or trace directory", async () => {
    const artifactDir = path.join(await makeTmpDir(), "artifacts");
    const reporter = createAgentInspectJestReporter({ artifactDir });

    await reporter.onTestResult(
      undefined,
      makeJestResult({
        status: "failed",
        testFilePath: path.join(artifactDir, "missing.test.cjs"),
      }),
    );

    expect(reporter.getArtifacts()).toEqual([]);
    expect(reporter.getDiagnostics()).toEqual([]);
  });

  it("keeps successful associated tests quiet by default", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const file = path.join(dir, "passing-default.test.cjs");
    const reporter = createAgentInspectJestReporter({
      artifactDir,
      associations: {
        [`${file}::agent suite passes quietly`]: {
          runId: "run-pass",
          tracePath: "/tmp/passes.jsonl",
        },
      },
    });

    await reporter.onTestResult(
      undefined,
      makeJestResult({
        status: "passed",
        testFilePath: file,
        title: "passes quietly",
      }),
    );

    expect(reporter.getArtifacts()).toEqual([]);
    expect(reporter.getDiagnostics()).toEqual([]);
  });

  it("keeps successful trace artifacts only up to the configured bound", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const associations: Record<string, { runId: string; tracePath: string }> = {};
    const reporter = createAgentInspectJestReporter({
      artifactDir,
      associations,
      maxSuccessfulTraces: 10,
      retainSuccessful: 2,
    });

    for (let index = 0; index < 4; index += 1) {
      const file = path.join(dir, `passing-${index}.test.cjs`);
      associations[`${file}::agent suite passing ${index}`] = {
        runId: `run-${index}`,
        tracePath: `/tmp/passing-${index}.jsonl`,
      };
      await reporter.onTestResult(
        undefined,
        makeJestResult({
          status: "passed",
          testFilePath: file,
          title: `passing ${index}`,
        }),
      );
    }

    const artifacts = reporter.getArtifacts();
    expect(artifacts).toHaveLength(2);
    expect(artifacts.map((artifact) => artifact.status)).toEqual(["passed", "passed"]);
  });

  it("preserves original Jest failures when artifact writing fails", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "not-a-directory");
    await writeFile(artifactDir, "occupied");
    const diagnostics: string[] = [];
    const file = path.join(dir, "write-fails.test.cjs");
    const reporter = createAgentInspectJestReporter({
      artifactDir,
      associations: {
        [`${file}::agent suite write fails`]: {
          runId: "run-1",
          tracePath: "/tmp/write-fails.jsonl",
        },
      },
      onDiagnostic(diagnostic) {
        diagnostics.push(diagnostic.code);
      },
    });

    await expect(
      reporter.onTestResult(
        undefined,
        makeJestResult({
          status: "failed",
          testFilePath: file,
          title: "write fails",
        }),
      ),
    ).resolves.toBeUndefined();

    expect(reporter.getArtifacts()).toEqual([]);
    expect(diagnostics).toEqual(["artifact-write-failed"]);
    expect(reporter.getDiagnostics()[0]?.code).toBe("artifact-write-failed");
  });

  it("reads aggregated Jest results and appends a bounded summary", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const githubSummary = path.join(dir, "summary.md");
    const failFile = path.join(dir, "nested-fail.test.cjs");
    const passFile = path.join(dir, "nested-pass.test.cjs");
    const reporter = createAgentInspectJestReporter({
      artifactDir,
      associations: {
        [`${failFile}::agent suite nested fail`]: {
          runId: "run-nested",
          tracePath: "/tmp/nested.jsonl",
        },
        [`${passFile}::agent suite nested pass`]: {
          runId: "run-pass",
          tracePath: "/tmp/pass.jsonl",
        },
      },
      githubSummary,
      maxSuccessfulTraces: 1,
      retainSuccessful: true,
    });

    await reporter.onRunComplete(undefined, {
      testResults: [
        makeJestResult({
          status: "failed",
          testFilePath: failFile,
          title: "nested fail",
        }),
        makeJestResult({
          status: "passed",
          testFilePath: passFile,
          title: "nested pass",
        }),
      ],
    });

    expect(reporter.getArtifacts()).toHaveLength(2);
    const summary = await readFile(githubSummary, "utf-8");
    expect(summary).toContain("Failed test artifacts: 1");
    expect(summary).toContain("Passing test artifacts retained: 1");
    expect(summary).not.toContain("/tmp/nested.jsonl");
  });

  it("exposes a Jest custom reporter class without throwing through getLastError", async () => {
    const dir = await makeTmpDir();
    const file = path.join(dir, "class.test.cjs");
    const reporter = new AgentInspectJestReporter(undefined, {
      artifactDir: path.join(dir, "artifacts"),
      associations: {
        [`${file}::agent suite class reporter`]: {
          runId: "run-class",
          tracePath: "/tmp/class.jsonl",
        },
      },
    });

    await reporter.onTestResult(
      undefined,
      makeJestResult({
        status: "failed",
        testFilePath: file,
        title: "class reporter",
      }),
    );

    expect(reporter.getArtifacts()).toHaveLength(1);
    expect("getLastError" in reporter).toBe(false);
  });
});
