import { describe, expect, it } from "vitest";

import type {
  Run,
  Step,
  StepStatus,
  StepType,
  TraceEvent,
} from "../src/types.js";
import {
  isStepStatus,
  isStepType,
  isTraceEvent,
} from "../src/types.js";

describe("StepType", () => {
  it("allows all MVP literals", () => {
    const types: StepType[] = [
      "run",
      "llm",
      "tool",
      "decision",
      "logic",
      "state",
      "custom",
    ];
    expect(types).toHaveLength(7);
    for (const t of types) {
      expect(isStepType(t)).toBe(true);
    }
  });
});

describe("StepStatus", () => {
  it("allows running, success, and error", () => {
    const statuses: StepStatus[] = ["running", "success", "error"];
    expect(statuses).toHaveLength(3);
    for (const s of statuses) {
      expect(isStepStatus(s)).toBe(true);
    }
  });
});

describe("Run", () => {
  it("accepts a valid run without input/output fields", () => {
    const run: Run = {
      id: "run_abc",
      name: "my-run",
      status: "running",
      startTime: 1_700_000_000_000,
      endTime: 1_700_000_001_000,
      durationMs: 1_000,
      error: { message: "boom", stack: "at x" },
      metadata: { userId: "u1" },
    };
    expect(run.id).toBe("run_abc");
    expect(run).not.toHaveProperty("input");
    expect(run).not.toHaveProperty("output");
  });
});

describe("Step", () => {
  it("accepts timing, optional parent, llm metadata, and tool metadata", () => {
    const llmStep: Step = {
      id: "step_llm",
      runId: "run_abc",
      parentId: "step_parent",
      name: "call-model",
      type: "llm",
      status: "success",
      startTime: 100,
      endTime: 200,
      durationMs: 100,
      metadata: {
        model: "gpt-4o",
        tokens: { input: 10, output: 20, total: 30, cached: 4 },
      },
    };

    const toolStep: Step = {
      id: "step_tool",
      runId: "run_abc",
      name: "search",
      type: "tool",
      status: "running",
      startTime: 50,
      metadata: { toolName: "web_search" },
    };

    expect(llmStep.metadata?.model).toBe("gpt-4o");
    expect(llmStep.metadata?.tokens).toEqual({
      input: 10,
      output: 20,
      total: 30,
      cached: 4,
    });
    expect(toolStep.metadata?.toolName).toBe("web_search");
    expect(llmStep).not.toHaveProperty("input");
    expect(llmStep).not.toHaveProperty("output");
  });
});

describe("TraceEvent", () => {
  const ts = 1_700_000_000_000;

  it("run_started includes schemaVersion 0.1", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: ts,
      runId: "run_1",
      name: "agent",
      startTime: ts,
      metadata: { env: "test" },
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });

  it("run_completed success", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: ts,
      runId: "run_1",
      status: "success",
      endTime: ts + 100,
      durationMs: 100,
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });

  it("run_completed error", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: ts,
      runId: "run_1",
      status: "error",
      endTime: ts + 50,
      durationMs: 50,
      error: { message: "fail" },
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });

  it("step_started with parentId", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: ts,
      runId: "run_1",
      stepId: "step_child",
      parentId: "step_root",
      name: "nested",
      type: "logic",
      startTime: ts,
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });

  it("step_completed success", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: ts,
      runId: "run_1",
      stepId: "step_a",
      status: "success",
      endTime: ts + 10,
      durationMs: 10,
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });

  it("step_completed error", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: ts,
      runId: "run_1",
      stepId: "step_a",
      status: "error",
      endTime: ts + 10,
      durationMs: 10,
      error: { message: "step failed" },
    };
    expect(event.schemaVersion).toBe("0.1");
    expect(isTraceEvent(event)).toBe(true);
  });
});

describe("type guards", () => {
  it("isStepType", () => {
    expect(isStepType("llm")).toBe(true);
    expect(isStepType("invalid")).toBe(false);
  });

  it("isStepStatus", () => {
    expect(isStepStatus("success")).toBe(true);
    expect(isStepStatus("failed")).toBe(false);
  });

  it("isTraceEvent rejects partial run_started without schemaVersion", () => {
    expect(isTraceEvent({ event: "run_started" })).toBe(false);
  });

  it("isTraceEvent accepts a fully valid run_started", () => {
    const valid: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "r",
      name: "n",
      startTime: 1,
    };
    expect(isTraceEvent(valid)).toBe(true);
  });

  it("isTraceEvent rejects unknown event string", () => {
    expect(
      isTraceEvent({
        schemaVersion: "0.1",
        timestamp: 1,
        event: "step_failed",
      }),
    ).toBe(false);
  });
});
