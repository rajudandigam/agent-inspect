import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  fileWriter,
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

describe("fileWriter", () => {
  async function withTempDir<T>(run: (dir: string) => Promise<T>): Promise<T> {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-writer-"));
    try {
      return await run(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it("creates trace directories and writes per-run JSONL rows", async () => {
    await withTempDir(async (dir) => {
      const traceDir = path.join(dir, "nested", "traces");
      const writer = fileWriter({ dir: traceDir });

      await writer.write(event({ eventId: "first", runId: "run_file" }));
      await writer.write(event({ eventId: "second", runId: "run_file" }));
      await writer.flush?.();
      await writer.close?.();

      const raw = await readFile(path.join(traceDir, "run_file.jsonl"), "utf-8");
      const rows = raw
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as PersistedInspectEvent);

      expect(rows.map((row) => row.eventId)).toEqual(["first", "second"]);
      expect(writer.getStats?.()).toEqual({
        writtenEvents: 2,
        droppedEvents: 0,
        flushCount: 1,
        lastFlushAt: expect.any(String),
      });
    });
  });

  it("serializes concurrent writes in call order", async () => {
    await withTempDir(async (dir) => {
      const writer = fileWriter({ filePath: path.join(dir, "ordered.jsonl") });
      const writes: Promise<void>[] = [];

      for (let index = 0; index < 25; index += 1) {
        writes.push(
          writer.write(
            event({
              eventId: `event_${index.toString().padStart(2, "0")}`,
              runId: "run_ordered",
            }),
          ),
        );
      }

      await Promise.all(writes);
      await writer.flush?.();

      const raw = await readFile(path.join(dir, "ordered.jsonl"), "utf-8");
      const ids = raw
        .trim()
        .split("\n")
        .map((line) => (JSON.parse(line) as PersistedInspectEvent).eventId);

      expect(ids).toEqual(
        Array.from({ length: 25 }, (_, index) =>
          `event_${index.toString().padStart(2, "0")}`,
        ),
      );
    });
  });

  it("does not throw application-visible errors for filesystem failures", async () => {
    await withTempDir(async (dir) => {
      const blockingPath = path.join(dir, "not-a-directory");
      await writeFile(blockingPath, "block");
      const writer = fileWriter({
        filePath: path.join(blockingPath, "trace.jsonl"),
      });

      await expect(writer.write(event())).resolves.toBeUndefined();
      await expect(writer.flush?.()).resolves.toBeUndefined();

      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 0,
        droppedEvents: 1,
        flushCount: 1,
      });
      expect(writer.getStats?.().lastError).toEqual(expect.any(String));
    });
  });

  it("drops serialization failures without poisoning later writes", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "serialization.jsonl");
      const writer = fileWriter({ filePath });

      await writer.write(
        event({
          eventId: "bad",
          attributes: { bigint: BigInt(1) } as Record<string, unknown>,
        }),
      );
      await writer.write(event({ eventId: "good" }));
      await writer.close?.();

      const raw = await readFile(filePath, "utf-8");
      const rows = raw
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as PersistedInspectEvent);

      expect(rows.map((row) => row.eventId)).toEqual(["good"]);
      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 1,
        droppedEvents: 1,
      });
    });
  });

  it("drops writes after close", async () => {
    await withTempDir(async (dir) => {
      const writer = fileWriter({ filePath: path.join(dir, "closed.jsonl") });

      await writer.close?.();
      await writer.write(event());

      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 0,
        droppedEvents: 1,
      });
    });
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
