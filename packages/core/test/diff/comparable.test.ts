import { describe, expect, it } from "vitest";

import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  TraceEvent,
} from "../../src/types.js";

import { manualTraceEventsToComparableRun } from "../../src/diff/comparable.js";

function rs(runId: string, name: string, t: number): RunStartedEvent {
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
): RunCompletedEvent {
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
  t: number,
  type: StepStartedEvent["type"],
  parentId?: string,
  metadata?: Record<string, unknown>,
): StepStartedEvent {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: t,
    runId,
    stepId,
    parentId,
    name,
    type,
    startTime: t,
    metadata,
  };
}

function sc(
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string },
  metadata?: Record<string, unknown>,
): StepCompletedEvent & { metadata?: Record<string, unknown> } {
  return {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: endTime,
    runId,
    stepId,
    status,
    endTime,
    durationMs,
    error,
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

describe("manualTraceEventsToComparableRun", () => {
  it("converts a simple successful run", () => {
    const runId = "r1";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "p", "plan", 2, "logic"),
      sc(runId, "p", "success", 3, 10),
      ss(runId, "t", "search", 4, "tool"),
      sc(runId, "t", "success", 5, 20),
      rc(runId, "success", 6, 100),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.runId).toBe(runId);
    expect(c.name).toBe("agent");
    expect(c.status).toBe("success");
    expect(c.durationMs).toBe(100);
    expect(c.steps).toHaveLength(2);
    expect(c.steps[0]!.name).toBe("plan");
    expect(c.steps[0]!.status).toBe("success");
    expect(c.steps[1]!.name).toBe("search");
  });

  it("converts a failed run", () => {
    const runId = "r2";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "x", "step", 2, "tool"),
      sc(runId, "x", "error", 3, 5, { message: "boom" }),
      rc(runId, "error", 4, 50),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.status).toBe("error");
    expect(c.steps[0]!.status).toBe("error");
    expect(c.steps[0]!.error).toBe("boom");
  });

  it("builds nested steps from explicit parentId", () => {
    const runId = "r3";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "root", "root", 2, "logic"),
      ss(runId, "child", "child", 3, "tool", "root"),
      sc(runId, "child", "success", 4, 1),
      sc(runId, "root", "success", 5, 10),
      rc(runId, "success", 6, 20),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps).toHaveLength(1);
    expect(c.steps[0]!.children).toHaveLength(1);
    expect(c.steps[0]!.children[0]!.name).toBe("child");
  });

  it("keeps parallel siblings ordered by step_started order", () => {
    const runId = "r4";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "a", "first", 2, "logic"),
      ss(runId, "b", "second", 3, "logic"),
      sc(runId, "a", "success", 4, 1),
      sc(runId, "b", "success", 5, 1),
      rc(runId, "success", 6, 10),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps.map((s) => s.name)).toEqual(["first", "second"]);
  });

  it("uses running when step_completed is missing", () => {
    const runId = "r5";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "u", "unfinished", 2, "logic"),
      rc(runId, "success", 3, 10),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps[0]!.status).toBe("running");
  });

  it("keeps unresolved parent as root and tags metadata", () => {
    const runId = "r6";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "orphan", "orphan", 2, "logic", "missing-parent"),
      sc(runId, "orphan", "success", 3, 1),
      rc(runId, "success", 4, 5),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps).toHaveLength(1);
    expect(c.steps[0]!.metadata?.agent_inspect_diff_parent_missing).toBe(true);
  });

  it("uses duration from step_completed only", () => {
    const runId = "r7";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic"),
      sc(runId, "s", "success", 3, 42),
      rc(runId, "success", 4, 100),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps[0]!.durationMs).toBe(42);
  });

  it("preserves metadata from step_started", () => {
    const runId = "r8";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic", undefined, { toolName: "x" }),
      sc(runId, "s", "success", 3, 1),
      rc(runId, "success", 4, 5),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps[0]!.metadata?.toolName).toBe("x");
  });

  it("merges metadata from step_completed when present", () => {
    const runId = "r8b";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic", undefined, { a: 1 }),
      sc(runId, "s", "success", 3, 1, undefined, { b: 2 }),
      rc(runId, "success", 4, 5),
    ];
    const c = manualTraceEventsToComparableRun(events);
    expect(c.steps[0]!.metadata?.a).toBe(1);
    expect(c.steps[0]!.metadata?.b).toBe(2);
  });

  it("includes outputPreview only when metadata has explicit preview fields", () => {
    const runId = "r9";
    const withPreview: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic", undefined, { outputPreview: "out" }),
      sc(runId, "s", "success", 3, 1),
      rc(runId, "success", 4, 5),
    ];
    expect(manualTraceEventsToComparableRun(withPreview).steps[0]!.outputPreview).toBe("out");

    const noPreview: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic"),
      sc(runId, "s", "success", 3, 1),
      rc(runId, "success", 4, 5),
    ];
    expect(manualTraceEventsToComparableRun(noPreview).steps[0]!.outputPreview).toBeUndefined();
  });

  it("does not mutate input events", () => {
    const runId = "r10";
    const events: TraceEvent[] = [
      rs(runId, "agent", 1),
      ss(runId, "s", "step", 2, "logic", undefined, { k: 1 }),
      sc(runId, "s", "success", 3, 1),
      rc(runId, "success", 4, 5),
    ];
    const snap = JSON.stringify(events);
    manualTraceEventsToComparableRun(events);
    expect(JSON.stringify(events)).toBe(snap);
  });
});
