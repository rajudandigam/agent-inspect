import { describe, expect, it } from "vitest";

import {
  inspectEventToPersistedInspectEvent,
  inspectEventsToPersistedInspectEvents,
} from "../../src/persisted/from-inspect-event.js";
import type { InspectEvent } from "../../src/types/inspect-event.js";
import { isPersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";

const TS = 1_700_000_000_000;

function minimalEvent(overrides: Partial<InspectEvent> = {}): InspectEvent {
  return {
    eventId: "evt_1",
    runId: "run_abc",
    name: "llm-call",
    kind: "LLM",
    timestamp: TS,
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

describe("inspectEventToPersistedInspectEvent", () => {
  it("converts minimal InspectEvent to PersistedInspectEvent", () => {
    const persisted = inspectEventToPersistedInspectEvent(minimalEvent());
    expect(persisted.schemaVersion).toBe("0.2");
    expect(persisted.eventId).toBe("evt_1");
    expect(persisted.runId).toBe("run_abc");
    expect(persisted.kind).toBe("LLM");
    expect(persisted.name).toBe("llm-call");
    expect(persisted.source.type).toBe("manual");
  });

  it("preserves eventId, runId, parentId, kind, name, status, durationMs, confidence", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        parentId: "parent_1",
        status: "ok",
        durationMs: 42,
        confidence: "correlated",
      }),
    );
    expect(persisted.eventId).toBe("evt_1");
    expect(persisted.runId).toBe("run_abc");
    expect(persisted.parentId).toBe("parent_1");
    expect(persisted.kind).toBe("LLM");
    expect(persisted.name).toBe("llm-call");
    expect(persisted.status).toBe("ok");
    expect(persisted.durationMs).toBe(42);
    expect(persisted.confidence).toBe("correlated");
  });

  it("converts numeric timestamp to ISO string", () => {
    const persisted = inspectEventToPersistedInspectEvent(minimalEvent());
    expect(persisted.timestamp).toBe(new Date(TS).toISOString());
  });

  it("output passes isPersistedInspectEvent", () => {
    const persisted = inspectEventToPersistedInspectEvent(minimalEvent());
    expect(isPersistedInspectEvent(persisted)).toBe(true);
  });

  it.each([
    ["manual", "manual"],
    ["json-log", "json-log"],
    ["log4js", "log4js"],
    ["adapter", "adapter"],
  ] as const)(
    "preserves %s source type directly",
    (sourceType, expected) => {
      const persisted = inspectEventToPersistedInspectEvent(
        minimalEvent({ source: { type: sourceType } }),
      );
      expect(persisted.source.type).toBe(expected);
    },
  );

  it("maps pino to json-log with original source preserved", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({ source: { type: "pino" } }),
    );
    expect(persisted.source.type).toBe("json-log");
    expect(persisted.source.name).toBe("pino");
    expect(persisted.attributes?.originalSourceType).toBe("pino");
  });

  it("maps winston to json-log with original source preserved", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({ source: { type: "winston" } }),
    );
    expect(persisted.source.type).toBe("json-log");
    expect(persisted.source.name).toBe("winston");
    expect(persisted.attributes?.originalSourceType).toBe("winston");
  });

  it("preserves source file and line in attributes", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        source: { type: "json-log", file: "app.ts", line: 12 },
      }),
    );
    expect(persisted.attributes?.sourceFile).toBe("app.ts");
    expect(persisted.attributes?.sourceLine).toBe(12);
  });

  it("maps token usage from attributes.tokens", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        attributes: { tokens: { input: 10, output: 5 } },
      }),
    );
    expect(persisted.tokenUsage).toEqual({ input: 10, output: 5, total: 15 });
  });

  it("maps error from attributes.errorMessage and errorName", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        status: "error",
        attributes: {
          errorMessage: "boom",
          errorName: "Error",
        },
      }),
    );
    expect(persisted.error).toEqual({ message: "boom", name: "Error" });
  });

  it("does not invent error when errorMessage is missing", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        status: "error",
        attributes: { errorName: "Error" },
      }),
    );
    expect(persisted.error).toBeUndefined();
  });

  it("maps inputPreview/outputPreview to inputSummary/outputSummary", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({
        attributes: {
          inputPreview: "hello",
          outputPreview: "world",
        },
      }),
    );
    expect(persisted.inputSummary).toBe("hello");
    expect(persisted.outputSummary).toBe("world");
  });

  it("invalid timestamp falls back to epoch and marks attributes.invalidTimestamp", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({ timestamp: Number.NaN }),
    );
    expect(persisted.timestamp).toBe(new Date(0).toISOString());
    expect(persisted.attributes?.invalidTimestamp).toBe(true);
  });

  it("uses deterministic fallback eventId when eventId is empty", () => {
    const persisted = inspectEventToPersistedInspectEvent(
      minimalEvent({ eventId: "" }),
      { eventIndex: 3 },
    );
    expect(persisted.eventId).toBe("inspect:run_abc:LLM:llm-call:3");
  });

  it("does not mutate input object", () => {
    const event = minimalEvent({
      attributes: { foo: "bar" },
      source: { type: "pino", file: "a.ts", line: 1 },
    });
    const snapshot = structuredClone(event);
    inspectEventToPersistedInspectEvent(event);
    expect(event).toEqual(snapshot);
  });
});

describe("inspectEventsToPersistedInspectEvents", () => {
  it("batch conversion preserves length and uses index options", () => {
    const events = [
      minimalEvent({ eventId: "a" }),
      minimalEvent({ eventId: "", name: "second" }),
    ];
    const persisted = inspectEventsToPersistedInspectEvents(events);
    expect(persisted).toHaveLength(2);
    expect(persisted[0]!.eventId).toBe("a");
    expect(persisted[1]!.eventId).toBe("inspect:run_abc:LLM:second:1");
  });
});
