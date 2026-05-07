import { describe, expect, it } from "vitest";

import type { TraceMetadata } from "../src/types.js";
import { filterTraces } from "../src/trace-filter.js";

function meta(partial: Partial<TraceMetadata> & { runId: string }): TraceMetadata {
  const createdAt = partial.createdAt ?? new Date(1_700_000_000_000);
  return {
    status: partial.status ?? "unknown",
    eventCount: partial.eventCount ?? 0,
    filePath: partial.filePath ?? `/tmp/${partial.runId}.jsonl`,
    fileSize: partial.fileSize ?? 1,
    createdAt,
    ...partial,
  };
}

describe("filterTraces", () => {
  it("filters by status", () => {
    const traces = [meta({ runId: "a", status: "success" }), meta({ runId: "b", status: "error" })];
    expect(filterTraces(traces, { status: "error" }).map((t) => t.runId)).toEqual(["b"]);
  });

  it("filters by name substring (case-insensitive) and runId", () => {
    const traces = [
      meta({ runId: "run_abc", name: "Hotel Booking", status: "success" }),
      meta({ runId: "run_xyz", name: "Other", status: "success" }),
    ];
    expect(filterTraces(traces, { name: "hotel" }).map((t) => t.runId)).toEqual(["run_abc"]);
    expect(filterTraces(traces, { name: "xyz" }).map((t) => t.runId)).toEqual(["run_xyz"]);
  });

  it("filters by since using startedAt, falling back to createdAt", () => {
    const now = Date.now();
    const traces = [
      meta({ runId: "new", startedAt: now - 1_000, createdAt: new Date(now - 1_000) }),
      meta({ runId: "old", startedAt: now - 10_000_000, createdAt: new Date(now - 10_000_000) }),
      meta({ runId: "fallback", createdAt: new Date(now - 1_000) }),
    ];
    const out = filterTraces(traces, { since: "1h" }).map((t) => t.runId);
    expect(out).toContain("new");
    expect(out).toContain("fallback");
    expect(out).not.toContain("old");
  });

  it("sorts newest first before applying limit", () => {
    const traces = [
      meta({ runId: "a", startedAt: 1 }),
      meta({ runId: "b", startedAt: 3 }),
      meta({ runId: "c", startedAt: 2 }),
    ];
    const out = filterTraces(traces, { limit: 2 }).map((t) => t.runId);
    expect(out).toEqual(["b", "c"]);
  });

  it("does not mutate input array", () => {
    const traces = [meta({ runId: "a", startedAt: 1 }), meta({ runId: "b", startedAt: 2 })];
    const before = traces.map((t) => t.runId);
    filterTraces(traces, { limit: 1 });
    expect(traces.map((t) => t.runId)).toEqual(before);
  });

  it("propagates parseDuration errors for invalid since", () => {
    const traces = [meta({ runId: "a", startedAt: Date.now() })];
    expect(() => filterTraces(traces, { since: "bad" })).toThrow(/Invalid duration format/i);
  });
});

