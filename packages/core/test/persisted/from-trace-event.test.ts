import { describe, expect, it } from "vitest";

import {
  traceEventToPersistedInspectEvent,
  traceEventsToPersistedInspectEvents,
} from "../../src/persisted/from-trace-event.js";
import { isPersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";
import type { StepType, TraceEvent } from "../../src/types.js";

const TS = 1_700_000_000_000;

function runStarted(
  overrides: Partial<Extract<TraceEvent, { event: "run_started" }>> = {},
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: TS,
    runId: "run_abc",
    name: "support-agent",
    startTime: TS,
    ...overrides,
  };
}

function runCompleted(
  overrides: Partial<Extract<TraceEvent, { event: "run_completed" }>> = {},
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: TS + 100,
    runId: "run_abc",
    status: "success",
    endTime: TS + 100,
    durationMs: 100,
    ...overrides,
  };
}

function stepStarted(
  type: StepType,
  overrides: Partial<Extract<TraceEvent, { event: "step_started" }>> = {},
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: TS + 10,
    runId: "run_abc",
    stepId: "step_1",
    name: `step-${type}`,
    type,
    startTime: TS + 10,
    ...overrides,
  };
}

function stepCompleted(
  overrides: Partial<Extract<TraceEvent, { event: "step_completed" }>> = {},
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: TS + 50,
    runId: "run_abc",
    stepId: "step_1",
    status: "success",
    endTime: TS + 50,
    durationMs: 40,
    ...overrides,
  };
}

describe("traceEventToPersistedInspectEvent", () => {
  describe("run_started", () => {
    it("converts with RUN kind, running status, and metadata", () => {
      const event = runStarted({
        metadata: { region: "us-east", apiKey: "redacted" },
      });
      const out = traceEventToPersistedInspectEvent(event, { eventIndex: 0 });

      expect(out.schemaVersion).toBe("0.2");
      expect(out.kind).toBe("RUN");
      expect(out.status).toBe("running");
      expect(out.name).toBe("support-agent");
      expect(out.timestamp).toBe(new Date(TS).toISOString());
      expect(out.startedAt).toBe(new Date(TS).toISOString());
      expect(out.source).toEqual({
        type: "manual",
        name: "trace-event",
        version: "0.1",
      });
      expect(out.confidence).toBe("explicit");
      expect(out.attributes?.legacyEvent).toBe("run_started");
      expect(out.attributes?.metadata).toEqual({
        region: "us-east",
        apiKey: "redacted",
      });
      expect(isPersistedInspectEvent(out)).toBe(true);
    });
  });

  describe("run_completed", () => {
    it("maps success to ok with run name fallback", () => {
      const out = traceEventToPersistedInspectEvent(runCompleted(), {
        eventIndex: 1,
      });
      expect(out.status).toBe("ok");
      expect(out.name).toBe("run");
      expect(out.endedAt).toBe(new Date(TS + 100).toISOString());
      expect(out.durationMs).toBe(100);
      expect(isPersistedInspectEvent(out)).toBe(true);
    });

    it("maps error with message and stack in attributes", () => {
      const out = traceEventToPersistedInspectEvent(
        runCompleted({
          status: "error",
          error: { message: "boom", stack: "Error: boom\n  at x" },
        }),
        { eventIndex: 2 },
      );
      expect(out.status).toBe("error");
      expect(out.error).toEqual({ message: "boom", name: "Error" });
      expect(out.attributes?.errorStack).toBe("Error: boom\n  at x");
      expect(isPersistedInspectEvent(out)).toBe(true);
    });
  });

  describe("step_started", () => {
    it.each([
      ["run", "RUN"],
      ["llm", "LLM"],
      ["tool", "TOOL"],
      ["decision", "DECISION"],
      ["logic", "LOGIC"],
      ["state", "LOGIC"],
      ["custom", "LOGIC"],
    ] as const)("maps step type %s to kind %s", (type, kind) => {
      const out = traceEventToPersistedInspectEvent(stepStarted(type));
      expect(out.kind).toBe(kind);
      expect(isPersistedInspectEvent(out)).toBe(true);
    });

    it("preserves parentId, stepId, metadata, and tokenUsage", () => {
      const out = traceEventToPersistedInspectEvent(
        stepStarted("llm", {
          parentId: "step_parent",
          stepId: "step_child",
          metadata: {
            model: "gpt-test",
            tokens: { input: 12, output: 7 },
          },
        }),
        { eventIndex: 3 },
      );
      expect(out.parentId).toBe("step_parent");
      expect(out.attributes?.stepId).toBe("step_child");
      expect(out.attributes?.stepType).toBe("llm");
      expect(out.attributes?.metadata).toEqual({
        model: "gpt-test",
        tokens: { input: 12, output: 7 },
      });
      expect(out.tokenUsage).toEqual({ input: 12, output: 7, total: 19 });
      expect(isPersistedInspectEvent(out)).toBe(true);
    });
  });

  describe("step_completed", () => {
    it("maps success with LOGIC kind and stepId name", () => {
      const out = traceEventToPersistedInspectEvent(
        stepCompleted({ stepId: "step_xyz" }),
        { eventIndex: 4 },
      );
      expect(out.status).toBe("ok");
      expect(out.kind).toBe("LOGIC");
      expect(out.name).toBe("step_xyz");
      expect(out.endedAt).toBe(new Date(TS + 50).toISOString());
      expect(out.durationMs).toBe(40);
      expect(isPersistedInspectEvent(out)).toBe(true);
    });

    it("maps error status and message", () => {
      const out = traceEventToPersistedInspectEvent(
        stepCompleted({
          status: "error",
          error: { message: "tool failed" },
        }),
      );
      expect(out.status).toBe("error");
      expect(out.error).toEqual({ message: "tool failed", name: "Error" });
      expect(isPersistedInspectEvent(out)).toBe(true);
    });
  });

  it("produces deterministic event IDs", () => {
    const event = runStarted();
    const a = traceEventToPersistedInspectEvent(event, { eventIndex: 0 });
    const b = traceEventToPersistedInspectEvent(event, { eventIndex: 0 });
    const c = traceEventToPersistedInspectEvent(event, { eventIndex: 1 });

    expect(a.eventId).toBe(b.eventId);
    expect(c.eventId).not.toBe(a.eventId);
    expect(a.eventId).not.toMatch(/\s/);
    expect(a.eventId).toContain("manual:");
    expect(a.eventId).toContain("run_started");
  });

  it("batch conversion preserves length and validates all outputs", () => {
    const events = [
      runStarted(),
      stepStarted("tool"),
      stepCompleted(),
      runCompleted(),
    ];
    const out = traceEventsToPersistedInspectEvents(events);
    expect(out).toHaveLength(4);
    out.forEach((e, i) => {
      expect(isPersistedInspectEvent(e)).toBe(true);
      expect(e.eventId).toContain(`:${i}`);
    });
  });

  it("falls back for invalid timestamp", () => {
    const out = traceEventToPersistedInspectEvent(
      runStarted({ timestamp: Number.NaN, startTime: Number.NaN }),
    );
    expect(out.timestamp).toBe(new Date(0).toISOString());
    expect(out.attributes?.invalidTimestamp).toBe(true);
    expect(isPersistedInspectEvent(out)).toBe(true);
  });

  it("does not mutate the input event", () => {
    const event = runStarted({
      metadata: { count: 1 },
    });
    const snapshot = JSON.stringify(event);
    traceEventToPersistedInspectEvent(event);
    expect(JSON.stringify(event)).toBe(snapshot);
  });

  it("applies sourceName and sourceVersion overrides", () => {
    const out = traceEventToPersistedInspectEvent(runStarted(), {
      sourceName: "fixture",
      sourceVersion: "test-0.1",
    });
    expect(out.source).toEqual({
      type: "manual",
      name: "fixture",
      version: "test-0.1",
    });
  });
});
