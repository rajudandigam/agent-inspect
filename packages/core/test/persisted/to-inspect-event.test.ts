import { describe, expect, it } from "vitest";

import {
  persistedInspectEventToInspectEvent,
  persistedInspectEventsToInspectEvents,
} from "../../src/persisted/to-inspect-event.js";
import type { PersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";

const TS_ISO = "2023-11-14T22:13:20.000Z";
const TS_MS = Date.parse(TS_ISO);

function minimalPersisted(
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId: "evt_1",
    runId: "run_abc",
    name: "llm-call",
    kind: "LLM",
    timestamp: TS_ISO,
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

describe("persistedInspectEventToInspectEvent", () => {
  it("converts minimal PersistedInspectEvent to InspectEvent", () => {
    const inspect = persistedInspectEventToInspectEvent(minimalPersisted());
    expect(inspect.eventId).toBe("evt_1");
    expect(inspect.runId).toBe("run_abc");
    expect(inspect.kind).toBe("LLM");
    expect(inspect.name).toBe("llm-call");
    expect(inspect.source.type).toBe("manual");
  });

  it("preserves eventId, runId, parentId, kind, name, status, durationMs, confidence", () => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({
        parentId: "parent_1",
        status: "ok",
        durationMs: 99,
        confidence: "heuristic",
      }),
    );
    expect(inspect.eventId).toBe("evt_1");
    expect(inspect.runId).toBe("run_abc");
    expect(inspect.parentId).toBe("parent_1");
    expect(inspect.kind).toBe("LLM");
    expect(inspect.name).toBe("llm-call");
    expect(inspect.status).toBe("ok");
    expect(inspect.durationMs).toBe(99);
    expect(inspect.confidence).toBe("heuristic");
  });

  it("converts ISO timestamp to numeric ms", () => {
    const inspect = persistedInspectEventToInspectEvent(minimalPersisted());
    expect(inspect.timestamp).toBe(TS_MS);
  });

  it.each([
    ["manual", "manual"],
    ["json-log", "json-log"],
    ["log4js", "log4js"],
    ["adapter", "adapter"],
  ] as const)("%s source type maps correctly", (sourceType, expected) => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({ source: { type: sourceType } }),
    );
    expect(inspect.source.type).toBe(expected);
  });

  it.each(["ai-sdk", "otel"] as const)(
    "maps %s to adapter and preserves originalSourceType",
    (sourceType) => {
      const inspect = persistedInspectEventToInspectEvent(
        minimalPersisted({
          source: { type: sourceType, name: "vendor" },
        }),
      );
      expect(inspect.source.type).toBe("adapter");
      expect(inspect.attributes?.originalSourceType).toBe(sourceType);
      expect(inspect.attributes?.sourceName).toBe("vendor");
    },
  );

  it.each(["pino", "winston"] as const)(
    "maps json-log sourceName %s back to %s EventSource type",
    (name) => {
      const inspect = persistedInspectEventToInspectEvent(
        minimalPersisted({
          source: { type: "json-log", name },
          attributes: { originalSourceType: name },
        }),
      );
      expect(inspect.source.type).toBe(name);
    },
  );

  it("preserves inputSummary/outputSummary in attributes", () => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({
        inputSummary: "in",
        outputSummary: "out",
      }),
    );
    expect(inspect.attributes?.inputSummary).toBe("in");
    expect(inspect.attributes?.outputSummary).toBe("out");
  });

  it("preserves error in attributes", () => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({
        status: "error",
        error: { name: "Err", message: "failed", code: "E_FAIL" },
      }),
    );
    expect(inspect.attributes?.errorName).toBe("Err");
    expect(inspect.attributes?.errorMessage).toBe("failed");
    expect(inspect.attributes?.errorCode).toBe("E_FAIL");
  });

  it("preserves tokenUsage under attributes.tokens", () => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({
        tokenUsage: { input: 3, output: 7, total: 10, cached: 2 },
      }),
    );
    expect(inspect.attributes?.tokens).toEqual({
      input: 3,
      output: 7,
      total: 10,
      cached: 2,
    });
  });

  it("invalid timestamp falls back to 0 and marks attributes.invalidTimestamp", () => {
    const inspect = persistedInspectEventToInspectEvent(
      minimalPersisted({ timestamp: "not-a-date" }),
    );
    expect(inspect.timestamp).toBe(0);
    expect(inspect.attributes?.invalidTimestamp).toBe(true);
  });

  it("invalid persisted event throws in single converter", () => {
    expect(() =>
      persistedInspectEventToInspectEvent({} as PersistedInspectEvent),
    ).toThrow(/Invalid PersistedInspectEvent/);
  });

  it("does not mutate input object", () => {
    const event = minimalPersisted({
      attributes: { foo: "bar" },
      source: { type: "ai-sdk", name: "sdk" },
    });
    const snapshot = structuredClone(event);
    persistedInspectEventToInspectEvent(event);
    expect(event).toEqual(snapshot);
  });
});

describe("persistedInspectEventsToInspectEvents", () => {
  it("batch conversion throws by default on invalid event", () => {
    expect(() =>
      persistedInspectEventsToInspectEvents([
        minimalPersisted(),
        {} as PersistedInspectEvent,
      ]),
    ).toThrow(/Invalid PersistedInspectEvent/);
  });

  it("batch conversion skips invalid event when skipInvalid is true", () => {
    const out = persistedInspectEventsToInspectEvents(
      [minimalPersisted(), {} as PersistedInspectEvent, minimalPersisted({ eventId: "evt_2" })],
      { skipInvalid: true },
    );
    expect(out).toHaveLength(2);
    expect(out[0]!.eventId).toBe("evt_1");
    expect(out[1]!.eventId).toBe("evt_2");
  });
});
