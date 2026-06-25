# Trace writer proposal

**Status:** partially implemented for v1.6.0; `TraceWriter`, `fileWriter`, `memoryWriter`, and `nullWriter` are complete on `main`.
**Scope:** local writer contract and built-in writer implementations.
**Non-goals:** no network writer, no vendor sink, no provider pricing, no hidden telemetry.

## Problem

Current trace persistence is tied to the manual v0.1 filesystem writer. The runtime, adapters, tests, and future schema migration need a writer contract that can accept normalized events while isolating instrumentation failures from application code.

## Public experimental subpath

```ts
import {
  fileWriter,
  bufferedFileWriter,
  memoryWriter,
  nullWriter,
  compositeWriter,
} from "agent-inspect/writers";
```

## Contract

```ts
interface TraceWriter {
  write(event: PersistedInspectEvent): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
  getStats?(): TraceWriterStats;
}

interface TraceWriterStats {
  writtenEvents: number;
  droppedEvents: number;
  flushCount: number;
  lastFlushAt?: string;
  lastError?: string;
}
```

## Built-in writers

### Memory writer

Use for tests, adapter fixtures, eval harnesses, and deterministic snapshots. It should expose copied events and never mutate caller-owned objects.

Implemented on `main`.

### Null writer

Use for disabled mode, overhead comparisons, and integration tests that should not write files.

Implemented on `main`.

### Direct file writer

Responsibilities:

- create trace directories safely;
- append normalized event rows;
- preserve event ordering;
- expose `flush()` and `close()`;
- report instrumentation errors to the runtime, not application code.

Implemented on `main`.

### Buffered file writer

Configuration:

```ts
bufferedFileWriter({
  dir: ".agent-inspect",
  maxQueueSize: 1000,
  flushIntervalMs: 250,
  maxBatchSize: 100,
  overflow: "drop-oldest",
});
```

Supported overflow modes:

- `drop-oldest`
- `drop-newest`

Do not add an overflow mode that throws into application code.

### Composite writer

Use for file plus memory observer, file plus explicit custom writer, and future multi-destination local workflows.

One failing child writer must not prevent other child writers from receiving events. Failures should be surfaced through diagnostics/stats.

## Safety requirements

- serialization failure isolation;
- directory permission failure isolation;
- partial write failure handling;
- idempotent flush/close;
- concurrent writes;
- queue overflow accounting;
- large bounded event handling;
- redacted event preservation.

## Validation expectations

- Unit tests for every writer.
- Stress-ish tests for concurrent writes and overflow.
- No application error replacement.
- No network access.
- No new root runtime dependency without maintainer approval.
