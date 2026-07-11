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

  it("emits exact nanosecond timestamps as decimal strings for realistic epochs", () => {
    // 1750000000123 ms * 1e6 = 1.750000000123e18 ns, far beyond
    // Number.MAX_SAFE_INTEGER; a double round-trip loses up to ~128 ns.
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
    const parsed = JSON.parse(exportOpenInference(tree).content) as {
      spans: { start_time_unix_nano: string; end_time_unix_nano?: string }[];
    };

    const span = parsed.spans[0]!;
    expect(span.start_time_unix_nano).toBe("1750000000123000000");
    expect(span.end_time_unix_nano).toBe("1750000000579000000");
    // Values of this magnitude exceed Number.MAX_SAFE_INTEGER, so they must
    // never appear as raw JSON number literals (RFC 8259 interop range).
    expect(BigInt(span.start_time_unix_nano) > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(exportOpenInference(tree).content).not.toMatch(/_unix_nano":\s*\d/);
  });

  it("matches the OTLP exporter's string encoding and the committed import fixture", () => {
    const tree = manualTraceEventsToRunTree(treeWithLlm());
    const parsed = JSON.parse(exportOpenInference(tree).content) as {
      spans: { start_time_unix_nano: unknown; end_time_unix_nano?: unknown }[];
    };
    for (const span of parsed.spans) {
      expect(typeof span.start_time_unix_nano).toBe("string");
      expect(span.start_time_unix_nano).toMatch(/^\d+$/);
      if (span.end_time_unix_nano !== undefined) {
        expect(typeof span.end_time_unix_nano).toBe("string");
      }
    }
  });
});
