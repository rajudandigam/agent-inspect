import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function rs(runId: string, name: string, t: number): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: t,
    runId,
    name,
    startTime: t,
  };
}

function rc(
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

function ss(
  runId: string,
  stepId: string,
  name: string,
  startTime: number,
  type: "logic" | "llm" | "tool",
  parentId?: string,
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: startTime,
    runId,
    stepId,
    name,
    type,
    startTime,
    ...(parentId !== undefined ? { parentId } : {}),
  };
}

function sc(
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  err?: { message: string },
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
    ...(err !== undefined ? { error: err } : {}),
  };
}

describe("manualTraceEventsToRunTree", () => {
  it("minimal success trace", () => {
    const runId = "run_a";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "s1", "step", 10, "logic"),
      sc(runId, "s1", "success", 20, 10),
      rc(runId, "success", 30, 29),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.runId).toBe(runId);
    expect(tree.name).toBe("n");
    expect(tree.status).toBe("ok");
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.event.kind).toBe("LOGIC");
    expect(tree.children[0]!.event.source.type).toBe("manual");
    expect(tree.children[0]!.event.confidence).toBe("explicit");
  });

  it("error trace maps step error", () => {
    const runId = "run_e";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "s1", "bad", 10, "logic"),
      sc(runId, "s1", "error", 20, 10, { message: "oops" }),
      rc(runId, "error", 30, 29),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.children[0]!.event.status).toBe("error");
  });

  it("nested steps preserve parentId", () => {
    const runId = "run_n";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "p", "p", 10, "logic"),
      ss(runId, "c", "c", 20, "logic", "p"),
      sc(runId, "c", "success", 30, 10),
      sc(runId, "p", "success", 40, 30),
      rc(runId, "success", 50, 49),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]!.children).toHaveLength(1);
  });

  it("parallel siblings", () => {
    const runId = "run_p";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "a", "A", 10, "logic"),
      ss(runId, "b", "B", 20, "logic"),
      sc(runId, "a", "success", 30, 20),
      sc(runId, "b", "success", 40, 20),
      rc(runId, "success", 50, 49),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.children).toHaveLength(2);
  });

  it("maps llm and tool types", () => {
    const runId = "run_m";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "l", "l", 10, "llm"),
      ss(runId, "t", "t", 15, "tool"),
      sc(runId, "l", "success", 20, 10),
      sc(runId, "t", "success", 25, 10),
      rc(runId, "success", 30, 29),
    ];
    const tree = manualTraceEventsToRunTree(events);
    const kinds = new Set(tree.children.map((c) => c.event.kind));
    expect(kinds.has("LLM")).toBe(true);
    expect(kinds.has("TOOL")).toBe(true);
  });

  it("missing run_completed leaves running", () => {
    const runId = "run_u";
    const events: TraceEvent[] = [rs(runId, "n", 1)];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.status).toBe("running");
  });

  it("missing step_completed leaves running node", () => {
    const runId = "run_o";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "s", "open", 10, "logic"),
      rc(runId, "success", 40, 39),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.children[0]!.event.status).toBe("running");
  });

  it("no timestamp-only nesting", () => {
    const runId = "run_t";
    const events: TraceEvent[] = [
      rs(runId, "n", 1),
      ss(runId, "first", "one", 100, "logic"),
      ss(runId, "second", "two", 200, "logic"),
      sc(runId, "first", "success", 300, 200),
      sc(runId, "second", "success", 400, 200),
      rc(runId, "success", 500, 499),
    ];
    const tree = manualTraceEventsToRunTree(events);
    expect(tree.children).toHaveLength(2);
  });

  it("does not mutate events", () => {
    const runId = "run_i";
    const events: TraceEvent[] = [rs(runId, "n", 1), rc(runId, "success", 2, 1)];
    const snap = JSON.stringify(events);
    manualTraceEventsToRunTree(events);
    expect(JSON.stringify(events)).toBe(snap);
  });

  it("throws without run_started", () => {
    expect(() => manualTraceEventsToRunTree([] as TraceEvent[])).toThrow(/run_started/);
  });
});
