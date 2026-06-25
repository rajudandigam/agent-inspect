import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import {
  preparePersistedInspectEventForWrite,
  resolveTraceSafetyOptions,
} from "../trace-event-safety.js";
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

export type BufferedFileWriterOverflowMode = "drop-oldest" | "drop-newest";

export interface BufferedFileWriterOptions extends FileTraceWriterOptions {
  /**
   * Maximum number of events retained before overflow policy applies.
   * Defaults to 1000.
   */
  maxQueueSize?: number;
  /**
   * Flush delay after the first queued event. Defaults to 250ms.
   */
  flushIntervalMs?: number;
  /**
   * Maximum events appended by one filesystem batch. Defaults to 100.
   */
  maxBatchSize?: number;
  /**
   * Overflow policy when `maxQueueSize` is reached. Defaults to `drop-oldest`.
   */
  overflow?: BufferedFileWriterOverflowMode;
}

export interface CompositeTraceWriterOptions {
  writers: TraceWriter[];
}

const DEFAULT_TRACE_SAFETY = resolveTraceSafetyOptions();

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

function prepareWriterEvent(
  event: PersistedInspectEvent,
): PersistedInspectEvent | undefined {
  return preparePersistedInspectEventForWrite(event, DEFAULT_TRACE_SAFETY);
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

function serializeEvent(event: PersistedInspectEvent): string {
  return `${JSON.stringify(event)}\n`;
}

async function appendEventLine(
  event: PersistedInspectEvent,
  options: FileTraceWriterOptions,
): Promise<void> {
  const filePath = resolveFilePath(event, options);
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, serializeEvent(event), "utf-8");
}

async function appendEventBatch(
  events: PersistedInspectEvent[],
  options: FileTraceWriterOptions,
): Promise<{ written: number; dropped: number; lastError?: string }> {
  const byPath = new Map<string, string[]>();
  let dropped = 0;
  let lastError: string | undefined;

  for (const event of events) {
    try {
      const filePath = resolveFilePath(event, options);
      const line = serializeEvent(event);
      const lines = byPath.get(filePath);
      if (lines) {
        lines.push(line);
      } else {
        byPath.set(filePath, [line]);
      }
    } catch (error) {
      dropped += 1;
      lastError = normalizeError(error);
    }
  }

  let written = 0;
  for (const [filePath, lines] of byPath) {
    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      await appendFile(filePath, lines.join(""), "utf-8");
      written += lines.length;
    } catch (error) {
      dropped += lines.length;
      lastError = normalizeError(error);
    }
  }

  return lastError
    ? { written, dropped, lastError }
    : { written, dropped };
}

export function memoryWriter(): MemoryTraceWriter {
  const events: PersistedInspectEvent[] = [];
  const stats = createInitialStats();

  return {
    async write(event) {
      const safe = prepareWriterEvent(event);
      if (safe === undefined) {
        recordDropped(stats, "Invalid persisted inspect event");
        return;
      }
      events.push(safe);
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
      return events.map((event) => structuredClone(event));
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
      const safe = prepareWriterEvent(event);
      if (safe === undefined) {
        recordDropped(stats, "Invalid persisted inspect event");
        return Promise.resolve();
      }
      return enqueue(safe);
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

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function nonNegativeInteger(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

export function bufferedFileWriter(
  options: BufferedFileWriterOptions = {},
): TraceWriter {
  const stats = createInitialStats();
  const maxQueueSize = positiveInteger(options.maxQueueSize, 1000);
  const flushIntervalMs = nonNegativeInteger(options.flushIntervalMs, 250);
  const maxBatchSize = positiveInteger(options.maxBatchSize, 100);
  const overflow = options.overflow ?? "drop-oldest";
  const pending: PersistedInspectEvent[] = [];
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();

  const clearTimer = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const scheduleFlush = (): void => {
    if (closed || timer !== undefined || pending.length === 0) return;
    timer = setTimeout(() => {
      timer = undefined;
      void drain(false);
    }, flushIntervalMs);
    if (
      timer &&
      typeof timer === "object" &&
      "unref" in timer &&
      typeof timer.unref === "function"
    ) {
      timer.unref();
    }
  };

  const drainBatch = async (drainAll: boolean): Promise<void> => {
    clearTimer();
    do {
      const batch = pending.splice(0, maxBatchSize);
      if (batch.length === 0) break;
      const result = await appendEventBatch(batch, options);
      stats.writtenEvents += result.written;
      stats.droppedEvents += result.dropped;
      if (result.lastError) {
        stats.lastError = result.lastError;
      }
    } while (drainAll && pending.length > 0);
    if (pending.length > 0) scheduleFlush();
  };

  const drain = (drainAll: boolean): Promise<void> => {
    const operation = chain.then(() => drainBatch(drainAll));
    chain = operation.catch(() => {
      // Keep later flushes alive even if an unexpected implementation error
      // escapes the batch isolation above.
    });
    return operation.catch(() => {
      // Instrumentation failures must not replace application errors.
    });
  };

  return {
    async write(event) {
      if (closed) {
        recordDropped(stats, "Trace writer is closed");
        return;
      }

      const safe = prepareWriterEvent(event);
      if (safe === undefined) {
        recordDropped(stats, "Invalid persisted inspect event");
        return;
      }

      if (pending.length >= maxQueueSize) {
        if (overflow === "drop-newest") {
          recordDropped(stats, "Trace writer queue overflow");
          return;
        }
        pending.shift();
        recordDropped(stats, "Trace writer queue overflow");
      }

      try {
        pending.push(safe);
      } catch (error) {
        recordDropped(stats, error);
        return;
      }

      scheduleFlush();
    },
    async flush() {
      await drain(true);
      markFlush(stats);
    },
    async close() {
      if (closed) return;
      await drain(true);
      closed = true;
      clearTimer();
    },
    getStats() {
      return cloneStats(stats);
    },
  };
}

export function compositeWriter(
  writersOrOptions: TraceWriter[] | CompositeTraceWriterOptions,
): TraceWriter {
  const stats = createInitialStats();
  const writers = Array.isArray(writersOrOptions)
    ? [...writersOrOptions]
    : [...writersOrOptions.writers];
  let closed = false;

  const recordChildFailure = (error: unknown): void => {
    stats.droppedEvents += 1;
    stats.lastError = normalizeError(error);
  };

  return {
    async write(event) {
      if (closed) {
        recordDropped(stats, "Trace writer is closed");
        return;
      }

      const safe = prepareWriterEvent(event);
      if (safe === undefined) {
        recordDropped(stats, "Invalid persisted inspect event");
        return;
      }

      const childResults = await Promise.all(
        writers.map(async (writer) => {
          try {
            await writer.write(structuredClone(safe));
            return true;
          } catch (error) {
            recordChildFailure(error);
            return false;
          }
        }),
      );

      if (childResults.some(Boolean)) {
        stats.writtenEvents += 1;
      } else {
        recordDropped(stats, "No composite trace writer accepted the event");
      }
    },
    async flush() {
      await Promise.all(
        writers.map(async (writer) => {
          try {
            await writer.flush?.();
          } catch (error) {
            stats.lastError = normalizeError(error);
          }
        }),
      );
      markFlush(stats);
    },
    async close() {
      if (closed) return;
      await Promise.all(
        writers.map(async (writer) => {
          try {
            await writer.close?.();
          } catch (error) {
            stats.lastError = normalizeError(error);
          }
        }),
      );
      closed = true;
    },
    getStats() {
      return cloneStats(stats);
    },
  };
}
