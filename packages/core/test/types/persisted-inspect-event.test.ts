import { describe, expect, it } from "vitest";

import {
  isPersistedInspectEvent,
  type PersistedInspectEvent,
} from "../../src/types/persisted-inspect-event.js";

function minimalEvent(
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId: "evt_abc123",
    runId: "run_xyz789",
    kind: "LOGIC",
    name: "plan",
    timestamp: "2024-11-14T12:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

describe("isPersistedInspectEvent", () => {
  it("valid minimal event passes", () => {
    expect(isPersistedInspectEvent(minimalEvent())).toBe(true);
  });

  it("valid event with all optional fields passes", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({
          parentId: "step_parent",
          status: "ok",
          startedAt: "2024-11-14T12:00:00.000Z",
          endedAt: "2024-11-14T12:00:01.000Z",
          durationMs: 1000,
          attributes: { model: "fixture" },
          inputSummary: { preview: "in" },
          outputSummary: { preview: "out" },
          error: { message: "failed", name: "Error", code: "E_FAIL" },
          tokenUsage: { input: 10, output: 5, total: 15 },
          trace: {
            traceId: "trace-1",
            spanId: "span-1",
            parentSpanId: "span-0",
          },
          source: { type: "adapter", name: "langchain", version: "0.1.0" },
        }),
      ),
    ).toBe(true);
  });

  it.each([
    "manual",
    "json-log",
    "log4js",
    "adapter",
    "ai-sdk",
    "otel",
  ] as const)("source.type %s passes", (type) => {
    expect(isPersistedInspectEvent(minimalEvent({ source: { type } }))).toBe(
      true,
    );
  });

  it.each(["running", "ok", "error", "unknown"] as const)(
    "status %s passes",
    (status) => {
      expect(isPersistedInspectEvent(minimalEvent({ status }))).toBe(true);
    },
  );

  it("wrong schemaVersion fails", () => {
    expect(
      isPersistedInspectEvent({ ...minimalEvent(), schemaVersion: "0.1" }),
    ).toBe(false);
  });

  it("missing eventId fails", () => {
    const e = minimalEvent();
    delete (e as { eventId?: string }).eventId;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("missing runId fails", () => {
    const e = minimalEvent();
    delete (e as { runId?: string }).runId;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("missing kind fails", () => {
    const e = minimalEvent();
    delete (e as { kind?: string }).kind;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("invalid kind fails", () => {
    expect(
      isPersistedInspectEvent(minimalEvent({ kind: "INVALID" as "LOGIC" })),
    ).toBe(false);
  });

  it("missing name fails", () => {
    const e = minimalEvent();
    delete (e as { name?: string }).name;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("empty required string fails", () => {
    expect(isPersistedInspectEvent(minimalEvent({ eventId: "" }))).toBe(false);
    expect(isPersistedInspectEvent(minimalEvent({ name: "" }))).toBe(false);
    expect(isPersistedInspectEvent(minimalEvent({ timestamp: "" }))).toBe(
      false,
    );
  });

  it("missing timestamp fails", () => {
    const e = minimalEvent();
    delete (e as { timestamp?: string }).timestamp;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("missing confidence fails", () => {
    const e = minimalEvent();
    delete (e as { confidence?: string }).confidence;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("invalid confidence fails", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ confidence: "guess" as "explicit" }),
      ),
    ).toBe(false);
  });

  it("missing source fails", () => {
    const e = minimalEvent();
    delete (e as { source?: unknown }).source;
    expect(isPersistedInspectEvent(e)).toBe(false);
  });

  it("invalid source.type fails", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ source: { type: "pino" as "manual" } }),
      ),
    ).toBe(false);
  });

  it("negative durationMs fails", () => {
    expect(isPersistedInspectEvent(minimalEvent({ durationMs: -1 }))).toBe(
      false,
    );
  });

  it("non-number durationMs fails", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ durationMs: "100" as unknown as number }),
      ),
    ).toBe(false);
  });

  it("invalid tokenUsage value fails", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ tokenUsage: { input: -1 } }),
      ),
    ).toBe(false);
    expect(
      isPersistedInspectEvent(
        minimalEvent({ tokenUsage: { output: NaN } }),
      ),
    ).toBe(false);
  });

  it("error object without message fails", () => {
    expect(
      isPersistedInspectEvent(minimalEvent({ error: { message: "" } })),
    ).toBe(false);
    expect(
      isPersistedInspectEvent(minimalEvent({ error: {} as { message: string } })),
    ).toBe(false);
  });

  it("trace object with non-string value fails", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ trace: { spanId: 123 as unknown as string } }),
      ),
    ).toBe(false);
  });

  it("attributes must be a record if present", () => {
    expect(
      isPersistedInspectEvent(
        minimalEvent({ attributes: [] as unknown as Record<string, unknown> }),
      ),
    ).toBe(false);
    expect(
      isPersistedInspectEvent(
        minimalEvent({ attributes: null as unknown as Record<string, unknown> }),
      ),
    ).toBe(false);
  });
});
