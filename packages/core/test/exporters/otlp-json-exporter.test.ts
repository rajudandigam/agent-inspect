import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import { exportOtlpJson } from "../../src/exporters/otlp-json-exporter.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function treeWithTokens(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_ot",
      name: "ot",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 10,
      runId: "run_ot",
      stepId: "llm1",
      name: "gen",
      type: "llm",
      startTime: 10,
      metadata: {
        model: "m",
        tokens: { input: 3, output: 4 },
      },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 20,
      runId: "run_ot",
      stepId: "llm1",
      status: "success",
      endTime: 20,
      durationMs: 10,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 30,
      runId: "run_ot",
      status: "success",
      endTime: 30,
      durationMs: 29,
    },
  ];
}

describe("exportOtlpJson", () => {
  it("has resourceSpans with spans", () => {
    const tree = manualTraceEventsToRunTree(treeWithTokens());
    const r = exportOtlpJson(tree);
    const o = JSON.parse(r.content) as {
      resourceSpans: { scopeSpans: { spans: { traceId: string }[] }[] }[];
    };
    expect(Array.isArray(o.resourceSpans)).toBe(true);
    expect(o.resourceSpans[0]!.scopeSpans[0]!.spans.length).toBe(1);
    expect(o.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.traceId.length).toBeGreaterThan(10);
  });

  it("deterministic trace id", () => {
    const tree = manualTraceEventsToRunTree(treeWithTokens());
    type P = {
      resourceSpans: { scopeSpans: { spans: { traceId: string }[] }[] }[];
    };
    const p1 = JSON.parse(exportOtlpJson(tree).content) as P;
    const p2 = JSON.parse(exportOtlpJson(tree).content) as P;
    expect(p1.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.traceId).toBe(
      p2.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.traceId,
    );
  });
});
