import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createAgentInspectVitestReporter } from "../src/index.js";

async function makeTmpDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "agent-inspect-vitest-"));
}

describe("@agent-inspect/vitest reporter", () => {
  it("writes a safe failure artifact from explicit trace metadata", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const tracePath = path.join(dir, "trace-with-secret.jsonl");
    await writeFile(
      tracePath,
      '{"input":"raw prompt","authorization":"Bearer sk-secret123456789"}\n',
    );

    const reporter = createAgentInspectVitestReporter({ artifactDir });
    await reporter.onTestCaseResult({
      id: "tests/agent.test.ts > failing agent",
      name: "failing agent",
      result: { state: "fail" },
      meta: {
        agentInspect: {
          artifactLabel: "failing-agent",
          runId: "run-secret:sk-secret123456789",
          tracePath,
        },
      },
    });

    const artifacts = reporter.getArtifacts();
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]?.status).toBe("failed");

    const summary = await readFile(artifacts[0]!.summaryPath, "utf-8");
    const manifest = await readFile(artifacts[0]!.manifestPath, "utf-8");
    const combined = `${summary}\n${manifest}`;

    expect(combined).toContain("failing agent");
    expect(combined).toContain(path.basename(tracePath));
    expect(combined).not.toContain(tracePath);
    expect(combined).not.toContain("raw prompt");
    expect(combined).not.toContain("Bearer");
    expect(combined).not.toContain("sk-secret123456789");
    expect(combined).toContain("[REDACTED]");
  });

  it("requires explicit association and does not guess by timestamp or trace directory", async () => {
    const artifactDir = path.join(await makeTmpDir(), "artifacts");
    const reporter = createAgentInspectVitestReporter({ artifactDir });

    await reporter.onTestCaseResult({
      id: "missing-trace",
      name: "missing trace",
      result: { state: "failed" },
    });

    expect(reporter.getArtifacts()).toEqual([]);
    expect(reporter.getDiagnostics()).toEqual([]);
  });

  it("keeps successful trace artifacts only up to the configured bound", async () => {
    const artifactDir = path.join(await makeTmpDir(), "artifacts");
    const reporter = createAgentInspectVitestReporter({
      artifactDir,
      retainSuccessful: 2,
      maxSuccessfulTraces: 10,
    });

    for (let index = 0; index < 4; index += 1) {
      await reporter.onTestCaseResult({
        id: `passing-${index}`,
        name: `passing ${index}`,
        result: { state: "passed" },
        meta: {
          agentInspect: {
            artifactLabel: `passing-${index}`,
            runId: `run-${index}`,
            tracePath: `/tmp/passing-${index}.jsonl`,
          },
        },
      });
    }

    const artifacts = reporter.getArtifacts();
    expect(artifacts).toHaveLength(2);
    expect(artifacts.map((artifact) => artifact.status)).toEqual(["passed", "passed"]);
  });

  it("preserves original Vitest failures when artifact writing fails", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "not-a-directory");
    await writeFile(artifactDir, "occupied");
    const diagnostics: string[] = [];
    const reporter = createAgentInspectVitestReporter({
      artifactDir,
      onDiagnostic(diagnostic) {
        diagnostics.push(diagnostic.code);
      },
    });

    await expect(
      reporter.onTestCaseResult({
        id: "write-fails",
        name: "write fails",
        result: { state: "failed" },
        meta: {
          agentInspect: {
            artifactLabel: "write-fails",
            runId: "run-1",
            tracePath: "/tmp/write-fails.jsonl",
          },
        },
      }),
    ).resolves.toBeUndefined();

    expect(reporter.getArtifacts()).toEqual([]);
    expect(diagnostics).toEqual(["artifact-write-failed"]);
    expect(reporter.getDiagnostics()[0]?.code).toBe("artifact-write-failed");
  });

  it("walks nested Vitest task updates and appends a bounded summary", async () => {
    const dir = await makeTmpDir();
    const artifactDir = path.join(dir, "artifacts");
    const githubSummary = path.join(dir, "summary.md");
    const reporter = createAgentInspectVitestReporter({
      artifactDir,
      githubSummary,
      retainSuccessful: true,
      maxSuccessfulTraces: 1,
    });

    await reporter.onTaskUpdate([
      {
        id: "suite",
        name: "suite",
        tasks: [
          {
            id: "nested-fail",
            name: "nested fail",
            result: { state: "failed" },
            meta: {
              agentInspect: {
                artifactLabel: "nested-fail",
                runId: "run-nested",
                tracePath: "/tmp/nested.jsonl",
              },
            },
          },
          {
            id: "nested-pass",
            name: "nested pass",
            result: { state: "passed" },
            meta: {
              agentInspect: {
                artifactLabel: "nested-pass",
                runId: "run-pass",
                tracePath: "/tmp/pass.jsonl",
              },
            },
          },
        ],
      },
    ]);
    await reporter.onFinished();

    expect(reporter.getArtifacts()).toHaveLength(2);
    const summary = await readFile(githubSummary, "utf-8");
    expect(summary).toContain("Failed test artifacts: 1");
    expect(summary).toContain("Passing test artifacts retained: 1");
    expect(summary).not.toContain("/tmp/nested.jsonl");
  });
});
