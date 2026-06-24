import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import type { TraceEvent } from "../src/types.js";
import { extractMetadata, buildRunSummary } from "../src/trace-metadata.js";

const ts = 1_700_000_000_000;
const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../..",
);

function runStarted(runId = "run_a", name = "n"): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: ts,
    runId,
    name,
    startTime: ts,
  };
}

function runCompleted(runId = "run_a", status: "success" | "error" = "success"): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: ts + 10,
    runId,
    status,
    endTime: ts + 10,
    durationMs: 10,
    ...(status === "error" ? { error: { message: "boom" } } : {}),
  } as TraceEvent;
}

function stepStarted(runId: string, stepId: string, type: any, parentId?: string): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: ts + 1,
    runId,
    stepId,
    parentId,
    name: stepId,
    type,
    startTime: ts + 1,
  };
}

function stepCompleted(runId: string, stepId: string, status: "success" | "error", durationMs = 5): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: ts + 6,
    runId,
    stepId,
    status,
    endTime: ts + 6,
    durationMs,
    ...(status === "error" ? { error: { message: "x" } } : {}),
  } as TraceEvent;
}

describe("extractMetadata", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-meta-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("extracts successful run metadata from run_started + run_completed", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    const lines = [runStarted("run_a", "hello"), runCompleted("run_a", "success")]
      .map((e) => JSON.stringify(e))
      .join("\n");
    await writeFile(fp, `${lines}\n`, "utf8");

    const meta = await extractMetadata(fp);
    expect(meta.runId).toBe("run_a");
    expect(meta.name).toBe("hello");
    expect(meta.status).toBe("success");
    expect(meta.eventCount).toBe(2);
    expect(meta.durationMs).toBe(10);
    expect(meta.fileSize).toBeGreaterThan(0);
    expect(meta.createdAt).toBeInstanceOf(Date);
  });

  it("extracts failed run metadata from run_completed status error", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    const lines = [runStarted("run_a", "hello"), runCompleted("run_a", "error")]
      .map((e) => JSON.stringify(e))
      .join("\n");
    await writeFile(fp, `${lines}\n`, "utf8");

    const meta = await extractMetadata(fp);
    expect(meta.status).toBe("error");
  });

  it("marks error when a step_completed is error and run_completed is missing", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    const events = [
      runStarted("run_a", "hello"),
      stepStarted("run_a", "s1", "tool"),
      stepCompleted("run_a", "s1", "error"),
    ];
    await writeFile(fp, `${events.map((e) => JSON.stringify(e)).join("\n")}\n`, "utf8");

    const meta = await extractMetadata(fp);
    expect(meta.status).toBe("error");
  });

  it("marks running when run_started exists but run_completed missing and no error steps", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    const events = [runStarted("run_a", "hello"), stepStarted("run_a", "s1", "logic")];
    await writeFile(fp, `${events.map((e) => JSON.stringify(e)).join("\n")}\n`, "utf8");

    const meta = await extractMetadata(fp);
    expect(meta.status).toBe("running");
  });

  it("uses filename as runId fallback when runId not present on any valid events", async () => {
    const fp = path.join(dir, "run_from_file.jsonl");
    // A valid trace event requires runId, so we only write malformed/blank lines.
    await writeFile(fp, `{"not":"an event"}\n`, "utf8");
    const meta = await extractMetadata(fp);
    expect(meta.runId).toBe("run_from_file");
    expect(meta.eventCount).toBe(0);
    expect(meta.status).toBe("unknown");
  });

  it("skips malformed lines", async () => {
    const fp = path.join(dir, "run_a.jsonl");
    await writeFile(
      fp,
      `${JSON.stringify(runStarted("run_a", "hello"))}\n{bad json}\n${JSON.stringify(runCompleted("run_a", "success"))}\n`,
      "utf8",
    );
    const meta = await extractMetadata(fp);
    expect(meta.eventCount).toBe(2);
    expect(meta.status).toBe("success");
  });

  it("extracts equivalent metadata from native v0.1 and v0.2 fixtures", async () => {
    const v01 = await extractMetadata(
      path.join(repoRoot, "fixtures/traces/dual-format-parity.jsonl"),
    );
    const v02 = await extractMetadata(
      path.join(repoRoot, "fixtures/traces-v0.2/dual-format-parity.jsonl"),
    );

    for (const meta of [v01, v02]) {
      expect(meta.runId).toBe("run_dual_format_parity");
      expect(meta.name).toBe("dual-format-parity");
      expect(meta.status).toBe("success");
      expect(meta.startedAt).toBe(1_700_000_100_000);
      expect(meta.endedAt).toBe(1_700_000_101_000);
      expect(meta.durationMs).toBe(1000);
    }
    expect(v01.eventCount).toBe(4);
    expect(v02.eventCount).toBe(2);
  });
});

describe("buildRunSummary", () => {
  it("counts step types and finds longestStep and maxDepth", () => {
    const runId = "run_a";
    const events: TraceEvent[] = [
      runStarted(runId, "r"),
      stepStarted(runId, "root", "logic"),
      stepStarted(runId, "tool1", "tool", "root"),
      stepCompleted(runId, "tool1", "success", 50),
      stepStarted(runId, "llm1", "llm", "tool1"),
      stepCompleted(runId, "llm1", "error", 10),
      stepCompleted(runId, "root", "success", 5),
      runCompleted(runId, "success"),
    ];

    const s = buildRunSummary(events);
    expect(s.runId).toBe(runId);
    expect(s.status).toBe("success");
    expect(s.totalSteps).toBe(3);
    expect(s.toolSteps).toBe(1);
    expect(s.llmSteps).toBe(1);
    expect(s.logicSteps).toBe(1);
    expect(s.errorSteps).toBe(1);
    expect(s.maxDepth).toBe(2);
    expect(s.longestStep?.name).toBe("tool1");
    expect(s.longestStep?.durationMs).toBe(50);
  });
});
