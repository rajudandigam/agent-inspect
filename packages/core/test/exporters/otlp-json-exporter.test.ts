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

function attrsOf(content: string): Array<{ key: string; value: Record<string, unknown> }> {
  const parsed = JSON.parse(content) as {
    resourceSpans: {
      scopeSpans: { spans: { attributes: Array<{ key: string; value: Record<string, unknown> }> }[] }[];
    }[];
  };
  return parsed.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.attributes;
}

describe("exportOtlpJson", () => {
  it("emits bounded operation/attempt/retry identity without includeAttributes", () => {
    const events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_id_map",
        name: "id-map",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 10,
        runId: "run_id_map",
        stepId: "a2",
        parentId: "op1",
        name: "retrieve_policy",
        type: "tool",
        startTime: 10,
        metadata: {
          operationId: "op1",
          attemptId: "a2",
          retryOf: "a1",
          attemptNumber: 2,
          secretPreview: "should-not-appear-without-includeAttributes",
        },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 20,
        runId: "run_id_map",
        stepId: "a2",
        status: "success",
        endTime: 20,
        durationMs: 10,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 30,
        runId: "run_id_map",
        status: "success",
        endTime: 30,
        durationMs: 29,
      },
    ];
    const tree = manualTraceEventsToRunTree(events);
    const r = exportOtlpJson(tree);
    const attrs = attrsOf(r.content);
    const byKey = Object.fromEntries(attrs.map((a) => [a.key, a.value]));
    expect(byKey["agent_inspect.operation_id"]).toEqual({ stringValue: "op1" });
    expect(byKey["agent_inspect.attempt_id"]).toEqual({ stringValue: "a2" });
    expect(byKey["agent_inspect.retry_of"]).toEqual({ stringValue: "a1" });
    expect(byKey["agent_inspect.attempt_number"]).toEqual({ intValue: "2" });
    expect(attrs.some((a) => a.key.includes("secretPreview"))).toBe(false);
    expect(r.warnings.some((w) => w.includes("operationId/attemptId/retryOf"))).toBe(true);
  });

  it("omits identity attributes when source did not record them", () => {
    const tree = manualTraceEventsToRunTree(treeWithTokens());
    const attrs = attrsOf(exportOtlpJson(tree).content);
    expect(attrs.some((a) => a.key === "agent_inspect.operation_id")).toBe(false);
    expect(attrs.some((a) => a.key === "agent_inspect.attempt_id")).toBe(false);
    expect(attrs.some((a) => a.key === "agent_inspect.retry_of")).toBe(false);
  });

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

  it("emits exact nanosecond timestamps as decimal strings for realistic epochs", () => {
    // Realistic epochs exceed Number.MAX_SAFE_INTEGER once scaled to ns.
    const startMs = 1_750_000_000_123;
    const durationMs = 456;
    const events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: startMs,
        runId: "run_ns",
        name: "ns",
        startTime: startMs,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: startMs,
        runId: "run_ns",
        stepId: "s",
        name: "x",
        type: "logic",
        startTime: startMs,
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: startMs + durationMs,
        runId: "run_ns",
        stepId: "s",
        status: "success",
        endTime: startMs + durationMs,
        durationMs,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: startMs + durationMs,
        runId: "run_ns",
        status: "success",
        endTime: startMs + durationMs,
        durationMs,
      },
    ];
    const tree = manualTraceEventsToRunTree(events);
    const parsed = JSON.parse(exportOtlpJson(tree).content) as {
      resourceSpans: {
        scopeSpans: {
          spans: { startTimeUnixNano: string; endTimeUnixNano?: string }[];
        }[];
      }[];
    };
    const span = parsed.resourceSpans[0]!.scopeSpans[0]!.spans[0]!;
    const expectedStart = BigInt(startMs) * 1_000_000n;
    const expectedEnd = expectedStart + BigInt(durationMs) * 1_000_000n;
    expect(span.startTimeUnixNano).toBe(String(expectedStart));
    expect(span.endTimeUnixNano).toBe(String(expectedEnd));
    expect(BigInt(span.startTimeUnixNano) > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it("emits numeric StatusCode and SpanKind enums", () => {
    const tree = manualTraceEventsToRunTree(treeWithTokens());
    const parsed = JSON.parse(exportOtlpJson(tree).content) as {
      resourceSpans: {
        scopeSpans: {
          spans: { kind: number; status: { code: number } }[];
        }[];
      }[];
    };
    const span = parsed.resourceSpans[0]!.scopeSpans[0]!.spans[0]!;
    expect(span.kind).toBe(1);
    expect(span.status.code).toBe(1);
  });
});
