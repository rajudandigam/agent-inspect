import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { exportOpenInference } from "../../src/exporters/openinference-exporter.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function treeWithLlm(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_oi",
      name: "oi",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 10,
      runId: "run_oi",
      stepId: "llm1",
      name: "gen",
      type: "llm",
      startTime: 10,
      metadata: {
        model: "gpt-test",
        tokens: { input: 5, output: 7 },
      },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 20,
      runId: "run_oi",
      stepId: "llm1",
      status: "success",
      endTime: 20,
      durationMs: 10,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 30,
      runId: "run_oi",
      status: "success",
      endTime: 30,
      durationMs: 29,
    },
  ];
}

describe("exportOpenInference", () => {
  it("parses JSON and includes compatibility metadata", () => {
    const tree = manualTraceEventsToRunTree(treeWithLlm());
    const r = exportOpenInference(tree);
    const parsed = JSON.parse(r.content) as {
      format: string;
      compatibility: string;
      spans: unknown[];
      trace_id: string;
    };
    expect(parsed.format).toBe("openinference");
    expect(parsed.compatibility).toContain("openinference");
    expect(parsed.spans.length).toBe(1);
    expect(parsed.trace_id.length).toBeGreaterThan(10);
  });

  it("deterministic trace_id for same run", () => {
    const tree = manualTraceEventsToRunTree(treeWithLlm());
    const a = JSON.parse(exportOpenInference(tree).content) as { trace_id: string };
    const b = JSON.parse(exportOpenInference(tree).content) as { trace_id: string };
    expect(a.trace_id).toBe(b.trace_id);
  });

  it("maps error status", () => {
    const events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_er",
        name: "e",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_er",
        stepId: "s",
        name: "x",
        type: "logic",
        startTime: 10,
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 20,
        runId: "run_er",
        stepId: "s",
        status: "error",
        endTime: 20,
        durationMs: 10,
        error: { message: "bad" },
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 30,
        runId: "run_er",
        status: "error",
        endTime: 30,
        durationMs: 29,
      },
    ];
    const tree = manualTraceEventsToRunTree(events);
    const parsed = JSON.parse(exportOpenInference(tree).content) as {
      spans: { status?: { code: string } }[];
    };
    expect(parsed.spans[0]!.status?.code).toBe("ERROR");
  });
});
