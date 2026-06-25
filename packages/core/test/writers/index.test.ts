import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bufferedFileWriter,
  compositeWriter,
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

describe("bufferedFileWriter", () => {
  async function withTempDir<T>(run: (dir: string) => Promise<T>): Promise<T> {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-buffered-writer-"));
    try {
      return await run(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it("buffers events and flushes them in bounded batches", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "buffered.jsonl");
      const writer = bufferedFileWriter({
        filePath,
        maxBatchSize: 2,
        flushIntervalMs: 60_000,
      });

      await writer.write(event({ eventId: "a" }));
      await writer.write(event({ eventId: "b" }));
      await writer.write(event({ eventId: "c" }));

      expect(writer.getStats?.()).toEqual({
        writtenEvents: 0,
        droppedEvents: 0,
        flushCount: 0,
      });

      await writer.flush?.();

      const raw = await readFile(filePath, "utf-8");
      const ids = raw
        .trim()
        .split("\n")
        .map((line) => (JSON.parse(line) as PersistedInspectEvent).eventId);

      expect(ids).toEqual(["a", "b", "c"]);
      expect(writer.getStats?.()).toEqual({
        writtenEvents: 3,
        droppedEvents: 0,
        flushCount: 1,
        lastFlushAt: expect.any(String),
      });
    });
  });

  it("flushes automatically after the configured interval", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "auto.jsonl");
      const writer = bufferedFileWriter({ filePath, flushIntervalMs: 5 });

      await writer.write(event({ eventId: "auto" }));
      await new Promise((resolve) => setTimeout(resolve, 25));
      await writer.close?.();

      const raw = await readFile(filePath, "utf-8");
      expect(JSON.parse(raw.trim()).eventId).toBe("auto");
      expect(writer.getStats?.().writtenEvents).toBe(1);
    });
  });

  it("drops newest events when configured queue overflow reaches the limit", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "drop-newest.jsonl");
      const writer = bufferedFileWriter({
        filePath,
        maxQueueSize: 2,
        overflow: "drop-newest",
        flushIntervalMs: 60_000,
      });

      await writer.write(event({ eventId: "first" }));
      await writer.write(event({ eventId: "second" }));
      await writer.write(event({ eventId: "third" }));
      await writer.flush?.();

      const raw = await readFile(filePath, "utf-8");
      const ids = raw
        .trim()
        .split("\n")
        .map((line) => (JSON.parse(line) as PersistedInspectEvent).eventId);

      expect(ids).toEqual(["first", "second"]);
      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 2,
        droppedEvents: 1,
      });
    });
  });

  it("drops oldest events by default when queue overflow reaches the limit", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "drop-oldest.jsonl");
      const writer = bufferedFileWriter({
        filePath,
        maxQueueSize: 2,
        flushIntervalMs: 60_000,
      });

      await writer.write(event({ eventId: "first" }));
      await writer.write(event({ eventId: "second" }));
      await writer.write(event({ eventId: "third" }));
      await writer.flush?.();

      const raw = await readFile(filePath, "utf-8");
      const ids = raw
        .trim()
        .split("\n")
        .map((line) => (JSON.parse(line) as PersistedInspectEvent).eventId);

      expect(ids).toEqual(["second", "third"]);
      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 2,
        droppedEvents: 1,
      });
    });
  });

  it("isolates serialization and filesystem failures from callers", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "serialization.jsonl");
      const writer = bufferedFileWriter({ filePath, flushIntervalMs: 60_000 });

      await expect(
        writer.write(
          event({
            eventId: "bad",
            attributes: { bigint: BigInt(1) } as Record<string, unknown>,
          }),
        ),
      ).resolves.toBeUndefined();
      await writer.write(event({ eventId: "good" }));
      await expect(writer.flush?.()).resolves.toBeUndefined();

      const raw = await readFile(filePath, "utf-8");
      expect(JSON.parse(raw.trim()).eventId).toBe("good");
      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 1,
        droppedEvents: 1,
      });

      const blockingPath = path.join(dir, "not-a-directory");
      await writeFile(blockingPath, "block");
      const failingWriter = bufferedFileWriter({
        filePath: path.join(blockingPath, "trace.jsonl"),
      });

      await expect(failingWriter.write(event())).resolves.toBeUndefined();
      await expect(failingWriter.flush?.()).resolves.toBeUndefined();
      expect(failingWriter.getStats?.()).toMatchObject({
        writtenEvents: 0,
        droppedEvents: 1,
      });
    });
  });

  it("drops writes after close", async () => {
    await withTempDir(async (dir) => {
      const writer = bufferedFileWriter({ filePath: path.join(dir, "closed.jsonl") });

      await writer.close?.();
      await writer.write(event());

      expect(writer.getStats?.()).toMatchObject({
        writtenEvents: 0,
        droppedEvents: 1,
      });
    });
  });
});

describe("compositeWriter", () => {
  it("fans out cloned events to every child writer", async () => {
    const first = memoryWriter();
    const second = memoryWriter();
    const writer = compositeWriter([first, second]);
    const source = event({ eventId: "fanout" });

    await writer.write(source);
    source.attributes = { changed: true };
    await writer.flush?.();
    await writer.close?.();

    expect(first.getEvents()).toEqual([
      expect.objectContaining({
        eventId: "fanout",
        attributes: { nested: { value: "original" } },
      }),
    ]);
    expect(second.getEvents()).toEqual(first.getEvents());
    expect(writer.getStats?.()).toEqual({
      writtenEvents: 1,
      droppedEvents: 0,
      flushCount: 1,
      lastFlushAt: expect.any(String),
    });
  });

  it("continues writing to healthy children when one child throws", async () => {
    const healthy = memoryWriter();
    const failing: TraceWriter = {
      async write() {
        throw new Error("child write failed");
      },
      async flush() {
        throw new Error("child flush failed");
      },
      async close() {
        throw new Error("child close failed");
      },
    };
    const writer = compositeWriter({ writers: [failing, healthy] });

    await expect(writer.write(event({ eventId: "kept" }))).resolves.toBeUndefined();
    await expect(writer.flush?.()).resolves.toBeUndefined();
    await expect(writer.close?.()).resolves.toBeUndefined();

    expect(healthy.getEvents().map((stored) => stored.eventId)).toEqual(["kept"]);
    expect(writer.getStats?.()).toMatchObject({
      writtenEvents: 1,
      droppedEvents: 1,
      flushCount: 1,
      lastError: expect.any(String),
    });
  });

  it("drops events when no child writer accepts them", async () => {
    const writer = compositeWriter([]);

    await writer.write(event());

    expect(writer.getStats?.()).toMatchObject({
      writtenEvents: 0,
      droppedEvents: 1,
      lastError: "No composite trace writer accepted the event",
    });
  });

  it("drops writes after close", async () => {
    const child = memoryWriter();
    const writer = compositeWriter([child]);

    await writer.close?.();
    await writer.write(event());

    expect(child.getEvents()).toEqual([]);
    expect(writer.getStats?.()).toMatchObject({
      writtenEvents: 0,
      droppedEvents: 1,
    });
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
