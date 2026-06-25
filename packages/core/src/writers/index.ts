import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";

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
