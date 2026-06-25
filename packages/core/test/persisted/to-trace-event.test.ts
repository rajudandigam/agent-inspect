import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  traceEventToPersistedInspectEvent,
  traceEventsToPersistedInspectEvents,
} from "../../src/persisted/from-trace-event.js";
import {
  persistedInspectEventToTraceEvents,
  persistedInspectEventsToTraceEvents,
} from "../../src/persisted/to-trace-event.js";
import { parseTraceJsonl } from "../../src/read-trace.js";
import { validateEvent } from "../../src/storage.js";
import type { StepType, TraceEvent } from "../../src/types.js";

const TS = 1_700_000_000_000;

function runStarted(): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: TS,
    runId: "run_abc",
    name: "support-agent",
    startTime: TS,
    metadata: { correlationId: "corr-1" },
  };
}

function runCompleted(): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: TS + 100,
    runId: "run_abc",
    status: "success",
    endTime: TS + 100,
    durationMs: 100,
  };
}

function stepStarted(
  type: StepType,
): Extract<TraceEvent, { event: "step_started" }> {
  return {
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: TS + 10,
    runId: "run_abc",
    stepId: "step_1",
    name: `step-${type}`,
    type,
    startTime: TS + 10,
    metadata: { tokens: { input: 5, output: 2 } },
  };
}

function stepCompleted(): Extract<TraceEvent, { event: "step_completed" }> {
  return {
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: TS + 50,
    runId: "run_abc",
    stepId: "step_1",
    status: "success",
    endTime: TS + 50,
    durationMs: 40,
  };
}

describe("persistedInspectEventToTraceEvents", () => {
  it("round-trips legacy-tagged persisted rows from v0.1", () => {
    const events = [runStarted(), stepStarted("llm"), stepCompleted(), runCompleted()];
    const persisted = traceEventsToPersistedInspectEvents(events);
    const back = persistedInspectEventsToTraceEvents(persisted);
    expect(back.map((e) => e.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
    const llm = back.find((e) => e.event === "step_started");
    expect(llm && llm.event === "step_started" ? llm.type : undefined).toBe("llm");
    expect(
      llm && llm.event === "step_started" ? llm.metadata?.tokens : undefined,
    ).toEqual({ input: 5, output: 2, total: 7 });
  });

  it("converts native v0.2 manual-basic fixture rows", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../../fixtures/traces-v0.2/manual-basic.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    const { format, events } = parseTraceJsonl(raw, { validate: validateEvent });
    expect(format).toBe("0.2");
    expect(events.some((e) => e.event === "run_started")).toBe(true);
    expect(events.some((e) => e.event === "step_started")).toBe(true);
    expect(events.some((e) => e.event === "step_completed")).toBe(true);
  });

  it("maps native tool error fixture to step error", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../../fixtures/traces-v0.2/manual-tool-error.jsonl",
    );
    const raw = await readFile(fixture, "utf-8");
    const { events } = parseTraceJsonl(raw, { validate: validateEvent });
    const completed = events.find((e) => e.event === "step_completed");
    expect(completed && completed.event === "step_completed" ? completed.status : undefined).toBe(
      "error",
    );
    expect(
      completed && completed.event === "step_completed"
        ? completed.error
        : undefined,
    ).toEqual({ message: "request failed (synthetic fixture)" });
  });

  it("does not map persisted error name or code to legacy stack", () => {
    const persisted = {
      schemaVersion: "0.2" as const,
      eventId: "native-error",
      runId: "run-error",
      kind: "TOOL" as const,
      name: "native-error",
      status: "error" as const,
      timestamp: "2023-11-14T22:13:20.000Z",
      durationMs: 1,
      confidence: "explicit" as const,
      source: { type: "manual" as const },
      error: { name: "TypeError", message: "boom", code: "E_SYNTHETIC" },
    };

    const completed = persistedInspectEventToTraceEvents(persisted).find(
      (event) => event.event === "step_completed",
    );
    expect(completed?.event).toBe("step_completed");
    if (completed?.event === "step_completed") {
      expect(completed.error).toEqual({ message: "boom" });
      expect(completed.error?.stack).toBeUndefined();
    }
  });

  it("round-trips a real legacy attributes.errorStack", () => {
    const failed: TraceEvent = {
      ...stepCompleted(),
      status: "error",
      error: { message: "boom", stack: "Error: boom\n  at synthetic" },
    };
    const persisted = traceEventToPersistedInspectEvent(failed);
    const [back] = persistedInspectEventToTraceEvents(persisted);

    expect(persisted.attributes?.errorStack).toBe("Error: boom\n  at synthetic");
    expect(back?.event).toBe("step_completed");
    if (back?.event === "step_completed") {
      expect(back.error).toEqual({
        message: "boom",
        stack: "Error: boom\n  at synthetic",
      });
    }
  });

  it("converts single persisted row via traceEventToPersistedInspectEvent", () => {
    const persisted = traceEventToPersistedInspectEvent(stepStarted("tool"));
    const back = persistedInspectEventToTraceEvents(persisted);
    expect(back).toHaveLength(1);
    expect(back[0]?.event).toBe("step_started");
  });

  it("preserves supplied total and cached usage during normalization", () => {
    const persisted = traceEventToPersistedInspectEvent(
      {
        ...stepStarted("llm"),
        metadata: {
          tokens: { input: 5, output: 2, total: 20, cached: 3 },
        },
      },
    );
    const [back] = persistedInspectEventToTraceEvents(persisted);

    expect(persisted.tokenUsage).toEqual({
      input: 5,
      output: 2,
      total: 20,
      cached: 3,
    });
    expect(back?.event).toBe("step_started");
    if (back?.event === "step_started") {
      expect(back.metadata?.tokens).toEqual({
        input: 5,
        output: 2,
        total: 20,
        cached: 3,
      });
    }
  });
});
