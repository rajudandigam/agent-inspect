import { describe, expect, it } from "vitest";

import type { TraceEvent } from "agent-inspect/advanced";

import { buildTuiTraceModel } from "../src/tree-model.js";

function runStarted(
  runId: string,
  name: string,
  startTime: number,
  timestamp: number,
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp,
    runId,
    name,
    startTime,
  };
}

function runCompleted(
  runId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: endTime,
    runId,
    status,
    endTime,
    durationMs,
  };
}

function stepStarted(
  runId: string,
  stepId: string,
  name: string,
  startTime: number,
  parentId?: string,
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: startTime,
    runId,
    stepId,
    name,
    type: "logic",
    startTime,
    ...(parentId !== undefined ? { parentId } : {}),
  };
}

function stepCompleted(
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string },
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: endTime,
    runId,
    stepId,
    status,
    endTime,
    durationMs,
    ...(error !== undefined ? { error } : {}),
  };
}

describe("buildTuiTraceModel", () => {
  it("builds model from simple trace", () => {
    const runId = "run_a";
    const events: TraceEvent[] = [
      runStarted(runId, "hello", 1, 1),
      stepStarted(runId, "s1", "first", 10),
      stepCompleted(runId, "s1", "success", 20, 10),
      runCompleted(runId, "success", 30, 29),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.runId).toBe(runId);
    expect(m.name).toBe("hello");
    expect(m.status).toBe("success");
    expect(m.durationMs).toBe(29);
    expect(m.nodes).toHaveLength(1);
    expect(m.nodes[0]!.name).toBe("first");
    expect(m.flatNodes).toHaveLength(1);
  });

  it("nested steps preserve parentId", () => {
    const runId = "run_n";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "p", "parent", 10),
      stepStarted(runId, "c", "child", 20, "p"),
      stepCompleted(runId, "c", "success", 30, 10),
      stepCompleted(runId, "p", "success", 40, 30),
      runCompleted(runId, "success", 50, 49),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.nodes).toHaveLength(1);
    const parent = m.nodes[0]!;
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]!.name).toBe("child");
    expect(parent.children[0]!.depth).toBe(1);
    expect(m.flatNodes.map((n) => n.name)).toEqual(["parent", "child"]);
  });

  it("parallel siblings stay siblings", () => {
    const runId = "run_p";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "a", "A", 10),
      stepStarted(runId, "b", "B", 20),
      stepCompleted(runId, "a", "success", 30, 20),
      stepCompleted(runId, "b", "success", 40, 20),
      runCompleted(runId, "success", 50, 49),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.nodes).toHaveLength(2);
    expect(m.nodes.map((n) => n.name)).toEqual(["A", "B"]);
  });

  it("failed step status/error captured", () => {
    const runId = "run_f";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "x", "bad", 10),
      stepCompleted(runId, "x", "error", 20, 10, { message: "boom" }),
      runCompleted(runId, "error", 30, 29),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.nodes[0]!.status).toBe("error");
    expect(m.nodes[0]!.error).toBe("boom");
  });

  it("incomplete step stays running", () => {
    const runId = "run_u";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "x", "open", 10),
      runCompleted(runId, "success", 50, 49),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.nodes[0]!.status).toBe("running");
  });

  it("does not nest by timestamp without parentId", () => {
    const runId = "run_t";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "first", "one", 100),
      stepStarted(runId, "second", "two", 200),
      stepCompleted(runId, "first", "success", 300, 200),
      stepCompleted(runId, "second", "success", 400, 200),
      runCompleted(runId, "success", 500, 499),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.nodes).toHaveLength(2);
    expect(m.nodes.every((n) => n.children.length === 0)).toBe(true);
  });

  it("flatNodes are depth-first ordered", () => {
    const runId = "run_df";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "root", "root", 10),
      stepStarted(runId, "c1", "c1", 20, "root"),
      stepStarted(runId, "c2", "c2", 30, "root"),
      stepCompleted(runId, "c1", "success", 40, 20),
      stepCompleted(runId, "c2", "success", 50, 20),
      stepCompleted(runId, "root", "success", 60, 50),
      runCompleted(runId, "success", 70, 69),
    ];
    const m = buildTuiTraceModel(events);
    expect(m.flatNodes.map((n) => n.name)).toEqual(["root", "c1", "c2"]);
  });

  it("does not mutate input events", () => {
    const runId = "run_m";
    const events: TraceEvent[] = [
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "s", "step", 10),
      stepCompleted(runId, "s", "success", 20, 10),
      runCompleted(runId, "success", 30, 29),
    ];
    const snap = JSON.stringify(events);
    buildTuiTraceModel(events);
    expect(JSON.stringify(events)).toBe(snap);
  });

  it("throws without run_started", () => {
    const runId = "run_bad";
    const events: TraceEvent[] = [
      stepStarted(runId, "s", "orphan", 10),
      stepCompleted(runId, "s", "success", 20, 10),
    ];
    expect(() => buildTuiTraceModel(events)).toThrow(/run_started/);
  });
});
