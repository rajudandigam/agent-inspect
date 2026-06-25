import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";
import { getTraceFilePath } from "../utils.js";

export interface TraceWriterStats {
  writtenEvents: number;
  droppedEvents: number;
  flushCount: number;
  lastFlushAt?: string;
  lastError?: string;
}

export interface TraceWriter {
  write(event: PersistedInspectEvent): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
  getStats?(): TraceWriterStats;
}

export interface MemoryTraceWriter extends TraceWriter {
  getEvents(): PersistedInspectEvent[];
  clear(): void;
}

export interface FileTraceWriterOptions {
  /**
   * Directory for per-run JSONL traces. Defaults to AgentInspect's default
   * trace directory when neither `dir` nor `filePath` is supplied.
   */
  dir?: string;
  /**
   * Explicit JSONL output path. When supplied, all accepted events are written
   * to this file rather than deriving a per-run file from `event.runId`.
   */
  filePath?: string;
}

function cloneEvent(event: PersistedInspectEvent): PersistedInspectEvent {
  return structuredClone(event);
}

function createInitialStats(): TraceWriterStats {
  return {
    writtenEvents: 0,
    droppedEvents: 0,
    flushCount: 0,
  };
}

function markFlush(stats: TraceWriterStats): void {
  stats.flushCount += 1;
  stats.lastFlushAt = new Date().toISOString();
}

function cloneStats(stats: TraceWriterStats): TraceWriterStats {
  return { ...stats };
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }
  return "Unknown trace writer error";
}

function recordDropped(stats: TraceWriterStats, error: unknown): void {
  stats.droppedEvents += 1;
  stats.lastError = normalizeError(error);
}

function resolveFilePath(
  event: PersistedInspectEvent,
  options: FileTraceWriterOptions,
): string {
  if (options.filePath && options.filePath.trim() !== "") {
    return path.resolve(options.filePath);
  }
  return getTraceFilePath(event.runId, options.dir);
}

async function appendEventLine(
  event: PersistedInspectEvent,
  options: FileTraceWriterOptions,
): Promise<void> {
  const filePath = resolveFilePath(event, options);
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf-8");
}

export function memoryWriter(): MemoryTraceWriter {
  const events: PersistedInspectEvent[] = [];
  const stats = createInitialStats();

  return {
    async write(event) {
      events.push(cloneEvent(event));
      stats.writtenEvents += 1;
    },
    async flush() {
      markFlush(stats);
    },
    async close() {
      // Memory writer has no external resources. Keep close idempotent.
    },
    getStats() {
      return cloneStats(stats);
    },
    getEvents() {
      return events.map(cloneEvent);
    },
    clear() {
      events.length = 0;
    },
  };
}

export function nullWriter(): TraceWriter {
  const stats = createInitialStats();

  return {
    async write() {
      stats.writtenEvents += 1;
    },
    async flush() {
      markFlush(stats);
    },
    async close() {
      // Null writer has no external resources. Keep close idempotent.
    },
    getStats() {
      return cloneStats(stats);
    },
  };
}

export function fileWriter(options: FileTraceWriterOptions = {}): TraceWriter {
  const stats = createInitialStats();
  let closed = false;
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (event: PersistedInspectEvent): Promise<void> => {
    const operation = queue.then(async () => {
      if (closed) {
        recordDropped(stats, "Trace writer is closed");
        return;
      }
      try {
        await appendEventLine(event, options);
        stats.writtenEvents += 1;
      } catch (error) {
        recordDropped(stats, error);
      }
    });

    queue = operation.catch(() => {
      // Individual operations are already isolated above. This catch keeps the
      // internal queue alive even if an unexpected implementation error slips
      // through.
    });

    return operation.catch(() => {
      // Instrumentation failures must not replace application errors.
    });
  };

  return {
    write(event) {
      return enqueue(cloneEvent(event));
    },
    async flush() {
      await queue;
      markFlush(stats);
    },
    async close() {
      if (closed) return;
      await queue;
      closed = true;
    },
    getStats() {
      return cloneStats(stats);
    },
  };
}
