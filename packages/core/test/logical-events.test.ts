import { describe, expect, it } from "vitest";

import {
  createSafetyRawContentRule,
  createStructureCycleRule,
  createStructureIncompleteRule,
  createStructureOrphanRule,
  createToolUsageRule,
  GEN_AI_TOOL_NAME_ATTRIBUTE,
  getCanonicalToolNameConflict,
  projectLogicalEvents,
  resolveCanonicalToolName,
  runTraceChecks,
} from "../src/checks/index.js";
import { traceEventToPersistedInspectEvent } from "../src/persisted/from-trace-event.js";
import type { TraceEvent } from "../src/types.js";
import type { TraceReadResult } from "../src/readers/index.js";
import type { InspectNode, InspectRunTree } from "../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";

function persisted(
  eventId: string,
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-logical",
    kind: "LOGIC",
    name: eventId,
    status: "ok",
    timestamp: "2026-08-04T00:00:01.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function node(event: PersistedInspectEvent, depth = 0): InspectNode {
  return {
    event: {
      eventId: event.eventId,
      runId: event.runId,
      parentId: event.parentId,
      kind: event.kind,
      name: event.name,
      status: event.status === "unknown" ? undefined : event.status,
      timestamp: Date.parse(event.timestamp),
      durationMs: event.durationMs,
      attributes: event.attributes,
      confidence: event.confidence,
      source: { type: "manual" },
    },
    children: [],
    depth,
  };
}

function readResult(events: PersistedInspectEvent[]): TraceReadResult {
  const children = events.map((event) => node(event, 1));
  const run: InspectRunTree = {
    runId: "run-logical",
    name: "logical",
    status: "ok",
    children,
    metadata: {
      totalEvents: children.length,
      confidenceBreakdown: {
        explicit: children.length,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: 0,
        TOOL: 0,
        CHAIN: 0,
        RETRIEVER: 0,
        DECISION: 0,
        RESULT: 0,
        ERROR: 0,
        LOGIC: children.length,
        LOG: 0,
        OUTCOME: 0,
      },
    },
  };
  return {
    format: "agent-inspect-jsonl",
    events,
    runs: [run],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

describe("projectLogicalEvents", () => {
  it("pairs v0.1 step_started TOOL with step_completed LOGIC", () => {
    const start = persisted("start-tool", {
      kind: "TOOL",
      name: "tool:search",
      status: "running",
      parentId: "parent-step",
      attributes: {
        legacyEvent: "step_started",
        stepId: "tool-1",
        toolName: "search",
      },
    });
    const complete = persisted("complete-tool", {
      kind: "LOGIC",
      name: "tool-1",
      status: "ok",
      endedAt: "2026-08-04T00:00:02.000Z",
      durationMs: 100,
      attributes: {
        legacyEvent: "step_completed",
        stepId: "tool-1",
      },
    });
    const parent = persisted("parent-start", {
      kind: "CHAIN",
      name: "agent",
      status: "ok",
      attributes: { legacyEvent: "step_started", stepId: "parent-step" },
    });
    const parentDone = persisted("parent-done", {
      kind: "LOGIC",
      name: "parent-step",
      status: "ok",
      attributes: { legacyEvent: "step_completed", stepId: "parent-step" },
    });

    const { logicalEvents } = projectLogicalEvents([
      parent,
      start,
      complete,
      parentDone,
    ]);

    expect(logicalEvents).toHaveLength(2);
    const tool = logicalEvents.find((e) => e.kind === "TOOL");
    expect(tool?.status).toBe("ok");
    expect(tool?.projection.paired).toBe(true);
    expect(tool?.parentId).toBe(parent.eventId);
    expect(tool?.projection.parentNormalized).toBe(true);
    expect(logicalEvents.some((e) => e.eventId === complete.eventId)).toBe(false);
  });

  it("pairs run_started with run_completed", () => {
    const start = persisted("run-start", {
      kind: "RUN",
      name: "run",
      status: "running",
      attributes: { legacyEvent: "run_started" },
    });
    const complete = persisted("run-end", {
      kind: "RUN",
      name: "run",
      status: "ok",
      endedAt: "2026-08-04T00:00:03.000Z",
      attributes: { legacyEvent: "run_completed" },
    });
    const { logicalEvents } = projectLogicalEvents([start, complete]);
    expect(logicalEvents).toHaveLength(1);
    expect(logicalEvents[0]?.status).toBe("ok");
    expect(logicalEvents[0]?.projection.paired).toBe(true);
  });
});

describe("resolveCanonicalToolName", () => {
  it("reads nested metadata.toolName", () => {
    expect(
      resolveCanonicalToolName(
        persisted("t", {
          kind: "TOOL",
          name: "DynamicStructuredTool",
          attributes: { metadata: { toolName: "lookup_orders" } },
        }),
      ),
    ).toBe("lookup_orders");
  });

  it("prefers gen_ai.tool.name over display name for OTLP-style TOOL spans", () => {
    const event = persisted("otlp-tool", {
      kind: "TOOL",
      name: "execute_tool update_trip_draft",
      attributes: {
        "gen_ai.operation.name": "execute_tool",
        [GEN_AI_TOOL_NAME_ATTRIBUTE]: "update_trip_draft",
      },
    });
    expect(resolveCanonicalToolName(event)).toBe("update_trip_draft");
    // Display name and semantic attribute remain intact.
    expect(event.name).toBe("execute_tool update_trip_draft");
    expect(event.attributes?.[GEN_AI_TOOL_NAME_ATTRIBUTE]).toBe("update_trip_draft");
  });

  it("keeps explicit toolName ahead of gen_ai.tool.name", () => {
    const event = persisted("explicit-wins", {
      kind: "TOOL",
      name: "execute_tool update_trip_draft",
      attributes: {
        toolName: "explicit_tool",
        [GEN_AI_TOOL_NAME_ATTRIBUTE]: "update_trip_draft",
      },
    });
    expect(resolveCanonicalToolName(event)).toBe("explicit_tool");
    expect(getCanonicalToolNameConflict(event)).toEqual({
      explicit: "explicit_tool",
      semantic: "update_trip_draft",
    });
    expect(event.attributes?.toolName).toBe("explicit_tool");
    expect(event.attributes?.[GEN_AI_TOOL_NAME_ATTRIBUTE]).toBe("update_trip_draft");
  });

  it("keeps nested metadata ahead of gen_ai.tool.name", () => {
    expect(
      resolveCanonicalToolName(
        persisted("meta-wins", {
          kind: "TOOL",
          name: "execute_tool other",
          attributes: {
            metadata: { toolName: "nested_tool" },
            [GEN_AI_TOOL_NAME_ATTRIBUTE]: "semantic_tool",
          },
        }),
      ),
    ).toBe("nested_tool");
  });

  it("falls back safely for blank, whitespace, and non-string gen_ai.tool.name", () => {
    expect(
      resolveCanonicalToolName(
        persisted("blank", {
          kind: "TOOL",
          name: "tool:from_prefix",
          attributes: { [GEN_AI_TOOL_NAME_ATTRIBUTE]: "   " },
        }),
      ),
    ).toBe("from_prefix");
    expect(
      resolveCanonicalToolName(
        persisted("nonstring", {
          kind: "TOOL",
          name: "tool:from_prefix",
          attributes: { [GEN_AI_TOOL_NAME_ATTRIBUTE]: 42 },
        }),
      ),
    ).toBe("from_prefix");
    expect(
      resolveCanonicalToolName(
        persisted("absent", {
          kind: "TOOL",
          name: "function:legacy_fn",
        }),
      ),
    ).toBe("legacy_fn");
  });

  it("does not treat gen_ai.tool.name on non-TOOL events as a kind change", () => {
    const event = persisted("llm-control", {
      kind: "LLM",
      name: "execute_tool update_trip_draft",
      attributes: { [GEN_AI_TOOL_NAME_ATTRIBUTE]: "update_trip_draft" },
    });
    expect(event.kind).toBe("LLM");
    expect(resolveCanonicalToolName(event)).toBe("update_trip_draft");
  });

  it("reports no conflict when explicit and semantic names agree", () => {
    expect(
      getCanonicalToolNameConflict(
        persisted("agree", {
          kind: "TOOL",
          name: "tool:update_trip_draft",
          attributes: {
            toolName: "update_trip_draft",
            [GEN_AI_TOOL_NAME_ATTRIBUTE]: "update_trip_draft",
          },
        }),
      ),
    ).toBeUndefined();
  });
});

describe("logical projection through built-in checks", () => {
  it("passes incomplete/orphan and required-tool on bridged v0.1 tool lifecycle (N-1/N-3)", () => {
    const v0events: TraceEvent[] = [
      {
        schemaVersion: "0.1",
        event: "run_started",
        runId: "run-logical",
        name: "pilot",
        timestamp: 1,
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        runId: "run-logical",
        stepId: "tool-search",
        name: "search",
        type: "tool",
        timestamp: 2,
        startTime: 2,
        parentId: undefined,
        metadata: { toolName: "search", tokens: { input: 3, output: 1, total: 4 } },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        runId: "run-logical",
        stepId: "tool-search",
        timestamp: 3,
        endTime: 3,
        durationMs: 1,
        status: "success",
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        runId: "run-logical",
        timestamp: 4,
        endTime: 4,
        durationMs: 3,
        status: "success",
      },
    ];
    const events = v0events.map((event, eventIndex) =>
      traceEventToPersistedInspectEvent(event, { eventIndex }),
    );
    const read = readResult(events);

    const result = runTraceChecks(
      { read },
      {
        rules: [
          createStructureIncompleteRule(),
          createStructureOrphanRule(),
          createToolUsageRule({ required: ["search"] }),
          createSafetyRawContentRule(),
        ],
      },
    );

    expect(result.status).toBe("pass");
    expect(result.findings.filter((f) => f.status === "fail")).toHaveLength(0);
  });

  it("removes self-parent edges after remapping (N-4 read-path defense)", () => {
    const self = persisted("event-self", { parentId: "event-self", name: "chain:RunnableSequence" });
    const child = persisted("event-child", { parentId: "event-self", name: "llm:model" });
    const projection = projectLogicalEvents([self, child]);
    const logicalSelf = projection.logicalEvents.find((e) => e.eventId === "event-self");
    const logicalChild = projection.logicalEvents.find((e) => e.eventId === "event-child");
    expect(logicalSelf?.parentId).toBeUndefined();
    expect(logicalSelf?.projection.originalParentId).toBe("event-self");
    expect(logicalChild?.parentId).toBe("event-self");
    expect(
      projection.diagnostics.some((d) => d.code === "AI_LOGICAL_SELF_PARENT_REMOVED"),
    ).toBe(true);

    const cycle = runTraceChecks(
      { read: readResult([self, child]) },
      { rules: [createStructureCycleRule()] },
    );
    expect(cycle.findings.filter((f) => f.ruleId === "structure.cycle")).toHaveLength(0);
  });

  it("does not treat metadata.tokens.* metric leaves as raw content (N-2)", () => {
    const event = persisted("with-tokens", {
      attributes: {
        metadata: {
          tokens: { input: 128, output: 64, total: 192 },
          task: "answer the user",
        },
      },
    });
    const result = runTraceChecks(
      { read: readResult([event]) },
      { rules: [createSafetyRawContentRule()] },
    );
    const paths = result.findings.map((f) => String((f.actual as { path?: string })?.path ?? ""));
    expect(paths.some((path) => path.includes("tokens.input"))).toBe(false);
    expect(paths.some((path) => path.includes("task"))).toBe(true);
  });
});
