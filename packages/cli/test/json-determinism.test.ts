import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { list } from "../src/list.js";
import { searchCommand } from "../src/search.js";
import { sessionsCommand } from "../src/sessions.js";
import { statsCommand } from "../src/stats.js";
import { timelineCommand } from "../src/timeline.js";
import { view } from "../src/view.js";
import { whatCommand } from "../src/what.js";

/**
 * CLI JSON determinism contract (#108): repeated invocations over the same
 * fixture produce semantically identical JSON, and the stable key sets that
 * scripts depend on do not drift.
 *
 * Volatile-field handling (documented per the issue): the synthetic traces
 * use fixed epoch timestamps, so nothing in the payloads is wall-clock
 * derived. Machine-specific path fields (`filePath`, `traceDir`) and
 * file-metadata fields (`createdAt`, `fileSize`) are stable across repeated
 * invocations in one suite run and are asserted only for presence, never for
 * exact values.
 */

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

function traceA(): string {
  return jsonl(
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1_700_000_000_000,
      runId: "det-a",
      name: "det-a",
      startTime: 1_700_000_000_000,
      metadata: { sessionId: "sess-det" },
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 1_700_000_000_010,
      runId: "det-a",
      stepId: "s1",
      name: "tool:fetch",
      type: "tool",
      startTime: 1_700_000_000_010,
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 1_700_000_000_060,
      runId: "det-a",
      stepId: "s1",
      status: "success",
      endTime: 1_700_000_000_060,
      durationMs: 50,
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 1_700_000_000_100,
      runId: "det-a",
      status: "success",
      endTime: 1_700_000_000_100,
      durationMs: 100,
    }),
  );
}

function traceB(): string {
  return jsonl(
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1_700_000_001_000,
      runId: "det-b",
      name: "det-b",
      startTime: 1_700_000_001_000,
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 1_700_000_001_050,
      runId: "det-b",
      status: "error",
      endTime: 1_700_000_001_050,
      durationMs: 50,
      error: { message: "synthetic failure" },
    }),
  );
}

describe("CLI JSON determinism", () => {
  let traceDir: string;

  beforeAll(async () => {
    traceDir = path.join(
      os.tmpdir(),
      `agent-inspect-json-det-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    await mkdir(traceDir, { recursive: true });
    await writeFile(path.join(traceDir, "det-a.jsonl"), traceA(), "utf-8");
    await writeFile(path.join(traceDir, "det-b.jsonl"), traceB(), "utf-8");
  });

  afterAll(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  async function captureJson(run: () => Promise<void>): Promise<unknown> {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await run();
      return JSON.parse(logSpy.mock.calls.map((c) => String(c[0])).join("\n")) as unknown;
    } finally {
      logSpy.mockRestore();
    }
  }

  type CommandCase = {
    name: string;
    invoke: () => Promise<void>;
  };

  const cases: CommandCase[] = [
    { name: "list", invoke: () => list({ dir: traceDir, json: true }) },
    { name: "search", invoke: () => searchCommand({ dir: traceDir, kind: "tool", json: true }) },
    { name: "stats", invoke: () => statsCommand({ dir: traceDir, json: true }) },
    { name: "sessions", invoke: () => sessionsCommand({ dir: traceDir, json: true }) },
    { name: "view", invoke: () => view("det-a", { dir: traceDir, json: true }) },
    { name: "timeline", invoke: () => timelineCommand("det-a", { dir: traceDir, json: true }) },
    { name: "what", invoke: () => whatCommand("det-a", { dir: traceDir, json: true }) },
  ];

  for (const { name, invoke } of cases) {
    it(`${name} --json is identical across repeated invocations`, async () => {
      const first = await captureJson(invoke);
      const second = await captureJson(invoke);
      expect(second).toEqual(first);
    });
  }

  it("list rows keep their stable key set", async () => {
    const rows = (await captureJson(() => list({ dir: traceDir, json: true }))) as Array<
      Record<string, unknown>
    >;
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([
        "createdAt",
        "durationMs",
        "endedAt",
        "eventCount",
        "filePath",
        "fileSize",
        "name",
        "runId",
        "startedAt",
        "status",
      ]);
    }
    // Newest-first ordering is part of the scripting contract.
    expect(rows.map((row) => row.runId)).toEqual(["det-b", "det-a"]);
  });

  it("search rows keep their stable key set", async () => {
    const rows = (await captureJson(() =>
      searchCommand({ dir: traceDir, kind: "tool", json: true }),
    )) as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]!).sort()).toEqual([
      "durationMs",
      "filePath",
      "matchReason",
      "matchedFields",
      "runId",
      "runName",
      "runStatus",
      "stepId",
      "stepName",
      "stepType",
      "timestamp",
    ]);
  });

  it("stats payload keeps its stable key set and duration shape", async () => {
    const stats = (await captureJson(() => statsCommand({ dir: traceDir, json: true }))) as Record<
      string,
      unknown
    >;
    expect(Object.keys(stats).sort()).toEqual([
      "avgStepsPerRun",
      "duration",
      "errorCount",
      "errorRate",
      "runningCount",
      "slowestRuns",
      "slowestSteps",
      "successCount",
      "totalErrorSteps",
      "totalLlmSteps",
      "totalRuns",
      "totalSteps",
      "totalToolSteps",
      "traceDir",
      "unknownCount",
    ]);
    expect(Object.keys(stats.duration as Record<string, unknown>).sort()).toEqual([
      "avgMs",
      "maxMs",
      "minMs",
      "p50Ms",
      "p95Ms",
    ]);
    expect(stats.totalRuns).toBe(2);
    expect(stats.errorCount).toBe(1);
  });

  it("timeline payload keeps its stable shape", async () => {
    const timeline = (await captureJson(() =>
      timelineCommand("det-a", { dir: traceDir, json: true }),
    )) as { entries: Array<Record<string, unknown>> } & Record<string, unknown>;
    expect(Object.keys(timeline).sort()).toEqual([
      "durationMs",
      "endedAt",
      "entries",
      "name",
      "runId",
      "startedAt",
      "status",
    ]);
    expect(Object.keys(timeline.entries[0]!).sort()).toEqual([
      "depth",
      "durationMs",
      "isError",
      "name",
      "offsetMs",
      "startedAt",
      "status",
      "stepId",
      "type",
    ]);
  });

  it("what payload keeps its stable key set", async () => {
    const what = (await captureJson(() =>
      whatCommand("det-a", { dir: traceDir, json: true }),
    )) as Record<string, unknown>;
    expect(Object.keys(what).sort()).toEqual([
      "durationMs",
      "errorSteps",
      "failedStepNames",
      "llmSteps",
      "logicSteps",
      "longestStep",
      "maxDepth",
      "name",
      "runId",
      "status",
      "toolSteps",
      "totalSteps",
    ]);
  });

  it("sessions payload keeps its stable shape", async () => {
    const sessions = (await captureJson(() =>
      sessionsCommand({ dir: traceDir, json: true }),
    )) as { sessions: Array<Record<string, unknown>> } & Record<string, unknown>;
    expect(Object.keys(sessions).sort()).toEqual([
      "sessions",
      "traceDir",
      "unscopedRunIds",
      "warnings",
    ]);
    expect(Object.keys(sessions.sessions[0]!).sort()).toEqual([
      "criticalPath",
      "durationMs",
      "endedAt",
      "groups",
      "handoffs",
      "lastActivity",
      "retries",
      "retryCount",
      "runIds",
      "sessionId",
      "startedAt",
      "status",
    ]);
  });

  it("view emits the persisted events verbatim and in file order", async () => {
    const events = (await captureJson(() =>
      view("det-a", { dir: traceDir, json: true }),
    )) as Array<Record<string, unknown>>;
    expect(events).toHaveLength(4);
    expect(events.map((event) => event.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
  });
});
