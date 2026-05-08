import { describe, expect, it } from "vitest";

import {
  diffTraceEvents,
  renderRunDiff,
  diffRuns,
} from "../../src/index.js";
import type { TraceEvent } from "../../src/types.js";

describe("diff package surface", () => {
  it("diffTraceEvents works on v0.1 trace events", () => {
    const runId = "x";
    const left: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId,
        name: "n",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 2,
        runId,
        status: "success",
        endTime: 2,
        durationMs: 5,
      },
    ];
    const right: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId,
        name: "n",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 2,
        runId,
        status: "error",
        endTime: 2,
        durationMs: 5,
      },
    ];
    const out = diffTraceEvents(left, right);
    expect(out.differences.some((d) => d.kind === "run-status")).toBe(true);
  });

  it("exports diffRuns and renderRunDiff from package entry", () => {
    expect(typeof diffRuns).toBe("function");
    expect(typeof renderRunDiff).toBe("function");
  });
});
