import { describe, expect, it } from "vitest";

import { diffRuns } from "../../src/diff/engine.js";
import type { RunComparable } from "../../src/diff/types.js";
import type { TraceEvent } from "../../src/types.js";

import { manualTraceEventsToComparableRun } from "../../src/diff/comparable.js";

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
  t: number,
  type: "logic" | "tool" | "llm",
  parentId?: string,
  meta?: Record<string, unknown>,
): TraceEvent {
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
    metadata: meta,
  };
}

function sc(
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  err?: { message: string },
  meta?: Record<string, unknown>,
): TraceEvent {
  const base = {
    schemaVersion: "0.1" as const,
    event: "step_completed" as const,
    timestamp: endTime,
    runId,
    stepId,
    status,
    endTime,
    durationMs,
    error: err,
  };
  return (meta !== undefined ? { ...base, metadata: meta } : base) as TraceEvent;
}

function stable(r: RunComparable): string {
  return JSON.stringify(r);
}

describe("diffRuns", () => {
  it("identical runs produce zero differences", () => {
    const runId = "same";
    const ev: TraceEvent[] = [
      rs(runId, "a", 1),
      ss(runId, "p", "plan", 2, "logic"),
      sc(runId, "p", "success", 3, 10),
      rc(runId, "success", 4, 100),
    ];
    const a = manualTraceEventsToComparableRun(ev);
    const b = manualTraceEventsToComparableRun(
      JSON.parse(JSON.stringify(ev)) as TraceEvent[],
    );
    const out = diffRuns(a, b);
    expect(out.differences).toHaveLength(0);
    expect(out.summary.totalDifferences).toBe(0);
  });

  it("detects run status difference", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "error", 2, 10),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "run-status")).toBe(true);
  });

  it("detects step added", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "a", "only-left", 2, "logic"),
      sc("r", "a", "success", 3, 1),
      rc("r", "success", 4, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "a", "only-left", 2, "logic"),
      sc("r", "a", "success", 3, 1),
      ss("r", "b", "extra", 4, "tool"),
      sc("r", "b", "success", 5, 1),
      rc("r", "success", 6, 10),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "step-added")).toBe(true);
  });

  it("detects step removed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "a", "x", 2, "logic"),
      sc("r", "a", "success", 3, 1),
      ss("r", "b", "y", 4, "tool"),
      sc("r", "b", "success", 5, 1),
      rc("r", "success", 6, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "a", "x", 2, "logic"),
      sc("r", "a", "success", 3, 1),
      rc("r", "success", 4, 10),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "step-removed")).toBe(true);
  });

  it("detects step status changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "tool", 2, "tool"),
      sc("r", "s", "success", 3, 5),
      rc("r", "success", 4, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "tool", 2, "tool"),
      sc("r", "s", "error", 3, 5, { message: "x" }),
      rc("r", "error", 4, 10),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "step-status")).toBe(true);
  });

  it("detects step type changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "tool"),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "step-type")).toBe(true);
  });

  it("detects error message changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "tool"),
      sc("r", "s", "error", 3, 1, { message: "a" }),
      rc("r", "error", 4, 5),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "tool"),
      sc("r", "s", "error", 3, 1, { message: "b" }),
      rc("r", "error", 4, 5),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "error")).toBe(true);
  });

  it("detects nested structure differences", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "root", "root", 2, "logic"),
      ss("r", "c", "child", 3, "tool", "root"),
      sc("r", "c", "success", 4, 1),
      sc("r", "root", "success", 5, 5),
      rc("r", "success", 6, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "root", "root", 2, "logic"),
      ss("r", "c", "child", 3, "llm", "root"),
      sc("r", "c", "success", 4, 1),
      sc("r", "root", "success", 5, 5),
      rc("r", "success", 6, 10),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.path?.path.some((p) => p.name === "child"))).toBe(
      true,
    );
  });

  it("detects duration changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 50),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "duration" && d.message.includes("Step"))).toBe(
      true,
    );
  });

  it("ignoreDuration skips duration differences", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 999),
    ]);
    const out = diffRuns(left, right, { ignoreDuration: true });
    expect(out.differences.filter((d) => d.kind === "duration")).toHaveLength(0);
  });

  it("durationThresholdMs suppresses small deltas", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 102),
    ]);
    const out = diffRuns(left, right, { durationThresholdMs: 5 });
    expect(out.differences.filter((d) => d.kind === "duration")).toHaveLength(0);
  });

  it("detects metadata changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { a: 1 }),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { a: 2 }),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "metadata")).toBe(true);
  });

  it("detects output preview changed", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { outputPreview: "a" }),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { outputPreview: "b" }),
      sc("r", "s", "success", 3, 1),
      rc("r", "success", 4, 5),
    ]);
    const out = diffRuns(left, right);
    expect(out.differences.some((d) => d.kind === "output")).toBe(true);
  });

  it("records first divergence from first filtered difference", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 50),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right);
    expect(out.summary.firstDivergence).toBeDefined();
    expect(out.summary.firstDivergence!.kind).toBe("first-divergence");
  });

  it("focus errors limits categories", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 50),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right, { focus: "errors" });
    expect(out.differences).toHaveLength(0);
  });

  it("focus structure limits categories", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 50),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right, { focus: "structure" });
    expect(out.differences).toHaveLength(0);
  });

  it("focus outputs limits categories", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { outputPreview: "x" }),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic", undefined, { outputPreview: "y" }),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right, { focus: "outputs" });
    expect(out.differences.every((d) => d.kind === "metadata" || d.kind === "output")).toBe(true);
  });

  it("check structure limits compared kinds", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "success", 2, 10),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      rc("r", "error", 2, 10),
    ]);
    const out = diffRuns(left, right, { check: "structure" });
    expect(out.differences).toHaveLength(0);
  });

  it("check outputs limits compared kinds", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "error", 3, 10),
      rc("r", "error", 4, 100),
    ]);
    const out = diffRuns(left, right, { check: "outputs" });
    expect(out.differences).toHaveLength(0);
  });

  it("check errors limits compared kinds", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 99),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right, { check: "errors" });
    expect(out.differences).toHaveLength(0);
  });

  it("check timing limits compared kinds", () => {
    const left = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 10),
      rc("r", "success", 4, 100),
    ]);
    const right = manualTraceEventsToComparableRun([
      rs("r", "n", 1),
      ss("r", "s", "step", 2, "logic"),
      sc("r", "s", "success", 3, 50),
      rc("r", "success", 4, 100),
    ]);
    const out = diffRuns(left, right, { check: "timing" });
    expect(out.differences.every((d) => d.kind === "duration")).toBe(true);
    expect(out.differences.length).toBeGreaterThan(0);
  });

  it("does not mutate inputs", () => {
    const mk = (): RunComparable => ({
      runId: "r",
      status: "success",
      durationMs: 5,
      steps: [
        {
          id: "s",
          name: "step",
          type: "logic",
          status: "success",
          durationMs: 2,
          children: [],
        },
      ],
    });
    const left = mk();
    const right = mk();
    const beforeL = stable(left);
    const beforeR = stable(right);
    diffRuns(left, right, { check: "all" });
    expect(stable(left)).toBe(beforeL);
    expect(stable(right)).toBe(beforeR);
  });

  it("matches steps by id across reorder when names align", () => {
    const left: RunComparable = {
      runId: "L",
      steps: [
        { id: "a", name: "one", type: "logic", status: "success", children: [] },
        { id: "b", name: "two", type: "logic", status: "success", children: [] },
      ],
    };
    const right: RunComparable = {
      runId: "R",
      steps: [
        { id: "b", name: "two", type: "logic", status: "success", children: [] },
        { id: "a", name: "one", type: "logic", status: "success", children: [] },
      ],
    };
    const out = diffRuns(left, right);
    expect(out.differences.filter((d) => d.kind === "step-added" || d.kind === "step-removed")).toHaveLength(
      0,
    );
  });
});
