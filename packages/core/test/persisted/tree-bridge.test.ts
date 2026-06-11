import { describe, expect, it } from "vitest";

import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";
import {
  persistedInspectEventsToRunTrees,
  traceEventsToPersistedRunTrees,
} from "../../src/persisted/tree-bridge.js";
import type { InspectNode } from "../../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";
import type { TraceEvent } from "../../src/types.js";

const TS = 1_700_000_000_000;
const TS_ISO = new Date(TS).toISOString();
const TS_LATER = TS + 60_000;
const TS_LATER_ISO = new Date(TS_LATER).toISOString();

function persisted(
  overrides: Partial<PersistedInspectEvent> & Pick<PersistedInspectEvent, "eventId" | "runId" | "name" | "kind">,
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    timestamp: TS_ISO,
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function countNodes(nodes: InspectNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

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
  };
}

describe("persistedInspectEventsToRunTrees", () => {
  it("builds a run tree from minimal persisted events with explicit parentId nesting", () => {
    const events: PersistedInspectEvent[] = [
      persisted({ eventId: "run-1", runId: "run_a", name: "agent", kind: "RUN" }),
      persisted({
        eventId: "tool-1",
        runId: "run_a",
        parentId: "run-1",
        name: "search",
        kind: "TOOL",
        timestamp: new Date(TS + 10).toISOString(),
      }),
    ];

    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees).toHaveLength(1);
    expect(trees[0]!.runId).toBe("run_a");
    expect(trees[0]!.children).toHaveLength(1);
    expect(trees[0]!.children[0]!.event.eventId).toBe("run-1");
    expect(trees[0]!.children[0]!.children).toHaveLength(1);
    expect(trees[0]!.children[0]!.children[0]!.event.kind).toBe("TOOL");
  });

  it("builds multiple run trees from persisted events", () => {
    const events: PersistedInspectEvent[] = [
      persisted({ eventId: "a1", runId: "run_a", name: "a", kind: "RUN" }),
      persisted({ eventId: "b1", runId: "run_b", name: "b", kind: "RUN" }),
    ];
    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees).toHaveLength(2);
    expect(new Set(trees.map((t) => t.runId))).toEqual(new Set(["run_a", "run_b"]));
  });

  it("sorts runs newest first through existing TreeBuilder behavior", () => {
    const events: PersistedInspectEvent[] = [
      persisted({
        eventId: "old",
        runId: "run_old",
        name: "old",
        kind: "RUN",
        timestamp: TS_ISO,
      }),
      persisted({
        eventId: "new",
        runId: "run_new",
        name: "new",
        kind: "RUN",
        timestamp: TS_LATER_ISO,
      }),
    ];
    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees[0]!.runId).toBe("run_new");
    expect(trees[1]!.runId).toBe("run_old");
  });

  it("preserves confidence breakdown and kind counts", () => {
    const events: PersistedInspectEvent[] = [
      persisted({
        eventId: "r1",
        runId: "run_meta",
        name: "run",
        kind: "RUN",
        confidence: "explicit",
      }),
      persisted({
        eventId: "l1",
        runId: "run_meta",
        name: "llm",
        kind: "LLM",
        confidence: "correlated",
        timestamp: new Date(TS + 5).toISOString(),
      }),
      persisted({
        eventId: "t1",
        runId: "run_meta",
        name: "tool",
        kind: "TOOL",
        confidence: "heuristic",
        timestamp: new Date(TS + 10).toISOString(),
      }),
    ];
    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees[0]!.metadata.totalEvents).toBe(3);
    expect(trees[0]!.metadata.confidenceBreakdown).toEqual({
      explicit: 1,
      correlated: 1,
      heuristic: 1,
      unknown: 0,
    });
    expect(trees[0]!.metadata.kinds.RUN).toBe(1);
    expect(trees[0]!.metadata.kinds.LLM).toBe(1);
    expect(trees[0]!.metadata.kinds.TOOL).toBe(1);
  });

  it("throws on invalid persisted event by default", () => {
    expect(() =>
      persistedInspectEventsToRunTrees([{} as PersistedInspectEvent]),
    ).toThrow(/Invalid PersistedInspectEvent/);
  });

  it("skips invalid persisted event when skipInvalid is true", () => {
    const events: PersistedInspectEvent[] = [
      persisted({ eventId: "ok1", runId: "run_a", name: "a", kind: "RUN" }),
      {} as PersistedInspectEvent,
      persisted({ eventId: "ok2", runId: "run_a", name: "b", kind: "TOOL" }),
    ];
    const trees = persistedInspectEventsToRunTrees(events, { skipInvalid: true });
    expect(trees).toHaveLength(1);
    expect(trees[0]!.metadata.totalEvents).toBe(2);
  });

  it("does not mutate input persisted events", () => {
    const events: PersistedInspectEvent[] = [
      persisted({ eventId: "e1", runId: "run_a", name: "n", kind: "RUN" }),
    ];
    const snapshot = structuredClone(events);
    persistedInspectEventsToRunTrees(events);
    expect(events).toEqual(snapshot);
  });

  it("does not nest by timestamp only — adjacent events without parentId stay at root", () => {
    const events: PersistedInspectEvent[] = [
      persisted({
        eventId: "e1",
        runId: "run_flat",
        name: "first",
        kind: "LOG",
        timestamp: TS_ISO,
      }),
      persisted({
        eventId: "e2",
        runId: "run_flat",
        name: "second",
        kind: "LOG",
        timestamp: new Date(TS + 1).toISOString(),
      }),
    ];
    const trees = persistedInspectEventsToRunTrees(events);
    expect(trees[0]!.children).toHaveLength(2);
    expect(trees[0]!.children[0]!.children).toHaveLength(0);
    expect(trees[0]!.children[1]!.children).toHaveLength(0);
  });
});

describe("traceEventsToPersistedRunTrees", () => {
  it("builds a run tree from legacy TraceEvent[] through persisted bridge", () => {
    const runId = "run_legacy";
    const events: TraceEvent[] = [
      rs(runId, "support-agent", TS),
      ss(runId, "step_1", "tool-step", TS + 10, "tool"),
      sc(runId, "step_1", "success", TS + 50, 40),
      rc(runId, "success", TS + 100, 100),
    ];

    const trees = traceEventsToPersistedRunTrees(events);
    expect(trees).toHaveLength(1);
    expect(trees[0]!.runId).toBe(runId);
    // TreeBuilder derives status from all events; run_started rows stay "running"
    // unlike manualTraceEventsToRunTree which uses run_completed for run status.
    expect(trees[0]!.status).toBe("running");
    expect(trees[0]!.children.length).toBeGreaterThanOrEqual(1);
  });

  it("legacy bridge output is broadly compatible with manualTraceEventsToRunTree", () => {
    const runId = "run_compare";
    const events: TraceEvent[] = [
      rs(runId, "n", TS),
      ss(runId, "s1", "step", TS + 10, "logic"),
      sc(runId, "s1", "success", TS + 20, 10),
      rc(runId, "success", TS + 30, 29),
    ];

    const manual = manualTraceEventsToRunTree(events);
    const bridge = traceEventsToPersistedRunTrees(events)[0]!;

    expect(bridge.runId).toBe(manual.runId);
    expect(countNodes(bridge.children)).toBeGreaterThanOrEqual(
      countNodes(manual.children),
    );
    expect(bridge.metadata.totalEvents).toBeGreaterThanOrEqual(
      manual.metadata.totalEvents,
    );
  });

  it("does not mutate input TraceEvent[]", () => {
    const events: TraceEvent[] = [
      rs("run_a", "n", TS),
      rc("run_a", "success", TS + 10, 10),
    ];
    const snapshot = structuredClone(events);
    traceEventsToPersistedRunTrees(events);
    expect(events).toEqual(snapshot);
  });
});
