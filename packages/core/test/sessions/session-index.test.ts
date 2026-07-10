import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../../src/trace-metadata.js";
import {
  buildSessionIndex,
  extractSessionWorkflowMetadata,
  type SessionRunRecord,
} from "../../src/sessions/index.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../fixtures/sessions",
);

async function loadSessionRuns(
  scenarioDir: string,
  files: string[],
): Promise<SessionRunRecord[]> {
  const out = [];
  for (const file of files) {
    const filePath = path.join(fixturesRoot, scenarioDir, file);
    const meta = await extractMetadata(filePath);
    const raw = await readFile(filePath, "utf-8");
    const firstLine = raw.split(/\r?\n/).find((line) => line.trim() !== "");
    let metadata: Record<string, unknown> | undefined;
    if (firstLine) {
      const parsed = JSON.parse(firstLine) as {
        metadata?: Record<string, unknown>;
      };
      metadata = parsed.metadata;
    }
    out.push({
      runId: meta.runId,
      name: meta.name,
      status: meta.status,
      startedAt: meta.startedAt,
      endedAt: meta.endedAt,
      durationMs: meta.durationMs,
      filePath,
      metadata,
    });
  }
  return out;
}

describe("extractSessionWorkflowMetadata", () => {
  it("extracts session and workflow keys", () => {
    const meta = extractSessionWorkflowMetadata({
      sessionId: "sess-1",
      workflowName: "wf",
      attempt: 2,
      retryOf: "run-a",
      handoffFrom: "a",
      handoffTo: "b",
    });
    expect(meta).toEqual({
      sessionId: "sess-1",
      workflowName: "wf",
      attempt: 2,
      retryOf: "run-a",
      handoffFrom: "a",
      handoffTo: "b",
    });
  });
});

describe("buildSessionIndex", () => {
  it("indexes multi-agent handoff fixture deterministically", async () => {
    const runs = await loadSessionRuns("multi-agent-handoff", [
      "handoff-worker.jsonl",
      "handoff-planner.jsonl",
    ]);
    const index = buildSessionIndex(runs);
    expect(index.sessions).toHaveLength(1);
    expect(index.sessions[0]?.sessionId).toBe("sess-handoff-001");
    expect(index.sessions[0]?.runIds).toEqual([
      "handoff-planner",
      "handoff-worker",
    ]);
    expect(index.sessions[0]?.handoffs).toEqual([
      {
        from: "handoff-planner",
        to: "handoff-worker",
        source: "manual",
        confidence: "explicit",
      },
    ]);
    expect(index.unscopedRunIds).toEqual([]);
  });

  it("indexes explicit retry links", async () => {
    const runs = await loadSessionRuns("retry-attempts", [
      "retry-run-1.jsonl",
      "retry-run-2.jsonl",
    ]);
    const index = buildSessionIndex(runs);
    expect(index.sessions[0]?.retries).toEqual([
      {
        runId: "retry-run-2",
        retryOf: "retry-run-1",
        attempt: 2,
        source: "manual",
        confidence: "explicit",
      },
    ]);
  });

  it("warns on ambiguous retry without retryOf", () => {
    const index = buildSessionIndex([
      {
        runId: "run-a",
        metadata: { sessionId: "s1", attempt: 1 },
        startedAt: 1,
      },
      {
        runId: "run-b",
        metadata: { sessionId: "s1", attempt: 2 },
        startedAt: 2,
      },
    ]);
    expect(
      index.warnings.some((warning) => warning.code === "ambiguous-retry-link"),
    ).toBe(true);
  });

  it("places runs without session metadata in unscopedRunIds", () => {
    const index = buildSessionIndex([
      { runId: "solo", startedAt: 1 },
      { runId: "other", startedAt: 2, metadata: { correlationId: "c1" } },
    ]);
    expect(index.unscopedRunIds).toEqual(["other", "solo"]);
    expect(index.warnings.some((w) => w.code === "missing-session-id")).toBe(
      true,
    );
  });

  it("orders runs deterministically by startedAt then runId", () => {
    const index = buildSessionIndex([
      { runId: "b", metadata: { sessionId: "s" }, startedAt: 2 },
      { runId: "a", metadata: { sessionId: "s" }, startedAt: 1 },
      { runId: "c", metadata: { sessionId: "s" }, startedAt: 2 },
    ]);
    expect(index.runs.map((run) => run.runId)).toEqual(["a", "b", "c"]);
  });
});
