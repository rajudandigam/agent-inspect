# Trace reader proposal

**Status:** partially implemented for v1.6.0; the public reader contract, custom-reader dispatch, deterministic detection helper, `readTrace()`, and `openTrace()` are complete on `main`.
**Scope:** universal local read contract and deterministic format detection.
**Non-goals:** no hosted ingestion, no database index, no silent arbitrary JSON acceptance.

## Problem

AgentInspect can read its own v0.1/v0.2 traces, but future workflows need one local reader interface for AgentInspect JSONL, OpenInference JSON, OTLP JSON payloads, files, directories, strings, buffers, and stdin.

Commands should not duplicate parsing logic.

## Public experimental subpath

```ts
import {
  openTrace,
  readTrace,
  detectTraceFormat,
} from "agent-inspect/readers";
```

## Input model

```ts
type TraceInput =
  | { type: "file"; path: string }
  | { type: "directory"; path: string }
  | { type: "string"; content: string }
  | { type: "buffer"; content: Buffer }
  | { type: "stdin" };
```

## Read result

```ts
interface TraceReadResult {
  format: string;
  events: PersistedInspectEvent[];
  runs: InspectRunTree[];
  warnings: TraceReadWarning[];
  unsupportedFields: string[];
  sourceFiles: string[];
}
```

## Built-in readers

- AgentInspect v0.1 JSONL.
- AgentInspect v0.2 JSONL.
- OpenInference JSON.
- OTLP/HTTP JSON trace payloads.

The first implementation slice defines the contract and custom-reader dispatch only. Built-in AgentInspect v0.1/v0.2, OpenInference, and OTLP readers are separate v1.6 chunks.

## Detection rules

Format detection must be:

- deterministic;
- ordered;
- inspectable;
- conservative;
- overrideable with `--format`;
- capable of reporting ambiguity.

Never silently treat arbitrary JSON as a valid trace.

## Warning examples

- unsupported span kind;
- missing parent ID;
- malformed timestamp;
- invalid duration;
- missing status;
- unknown semantic attribute;
- skipped event;
- multiple possible roots;
- truncated source payload;
- incompatible schema version.

## Universal `open`

The reader contract enables:

```bash
agent-inspect open ./trace.json
agent-inspect open ./trace.jsonl
agent-inspect open ./traces/
agent-inspect open - --format otlp-json
agent-inspect open ./trace.json --json
agent-inspect open ./trace.json --diagnostics
agent-inspect open ./trace.json --run <run-id>
```

For multiple runs, the CLI must list runs and require `--run` rather than selecting an arbitrary run silently.

## Validation expectations

- v0.1 and v0.2 fixture parity.
- OpenInference and OTLP synthetic fixtures.
- malformed/ambiguous input diagnostics.
- source file immutability.
- no OTel SDK dependency in core.
