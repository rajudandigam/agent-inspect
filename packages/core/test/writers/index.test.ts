import { describe, expect, it } from "vitest";

import {
  memoryWriter,
  nullWriter,
  type TraceWriter,
  type TraceWriterStats,
} from "../../src/writers/index.js";
import type { PersistedInspectEvent } from "../../src/types/persisted-inspect-event.js";

function event(overrides: Partial<PersistedInspectEvent> = {}): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId: "event_1",
    runId: "run_1",
    kind: "TOOL",
    name: "retrieve-policy",
    status: "ok",
    timestamp: "2026-06-24T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    attributes: { nested: { value: "original" } },
    ...overrides,
  };
}

describe("memoryWriter", () => {
  it("stores cloned events and returns cloned snapshots", async () => {
    const writer = memoryWriter();
    const source = event();

    await writer.write(source);
    source.attributes = { nested: { value: "mutated-source" } };

    const firstSnapshot = writer.getEvents();
    expect(firstSnapshot).toEqual([
      expect.objectContaining({
        eventId: "event_1",
        attributes: { nested: { value: "original" } },
      }),
    ]);

    firstSnapshot[0]!.attributes = { nested: { value: "mutated-snapshot" } };

    expect(writer.getEvents()[0]!.attributes).toEqual({
      nested: { value: "original" },
    });
  });

  it("tracks accepted writes and flushes", async () => {
    const writer = memoryWriter();

    await writer.write(event({ eventId: "a" }));
    await writer.write(event({ eventId: "b" }));
    await writer.flush?.();
    await writer.close?.();
    await writer.close?.();

    expect(writer.getEvents().map((stored) => stored.eventId)).toEqual(["a", "b"]);
    expect(writer.getStats?.()).toEqual({
      writtenEvents: 2,
      droppedEvents: 0,
      flushCount: 1,
      lastFlushAt: expect.any(String),
    });
  });

  it("clears stored events without resetting stats", async () => {
    const writer = memoryWriter();

    await writer.write(event());
    writer.clear();

    expect(writer.getEvents()).toEqual([]);
    expect(writer.getStats?.().writtenEvents).toBe(1);
  });
});

describe("nullWriter", () => {
  it("accepts events without retaining them", async () => {
    const writer = nullWriter();

    await writer.write(event());
    await writer.write(event({ eventId: "event_2" }));
    await writer.flush?.();
    await writer.close?.();
    await writer.close?.();

    expect(writer.getStats?.()).toEqual({
      writtenEvents: 2,
      droppedEvents: 0,
      flushCount: 1,
      lastFlushAt: expect.any(String),
    });
    expect("getEvents" in writer).toBe(false);
  });

  it("satisfies the TraceWriter type contract", () => {
    const writer: TraceWriter = nullWriter();
    const stats: TraceWriterStats | undefined = writer.getStats?.();

    expect(typeof writer.write).toBe("function");
    expect(stats?.writtenEvents).toBe(0);
  });
});
