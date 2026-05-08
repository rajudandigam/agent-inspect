# Schema (v1.0 stabilization — Pass 1)

This document describes the **persisted manual trace JSONL schema** and the **log-derived normalized model** used by AgentInspect.

## 1. Overview

AgentInspect has two related (but distinct) data models:

1. **Manual trace JSONL** (persisted): lines of `TraceEvent` written by `inspectRun()` / `step()`.
2. **Log-derived normalized model** (in-memory): `InspectEvent` / `InspectRunTree` built from structured logs or adapters.

Important: log-derived trees are **normalized views**, not the same persisted JSONL schema.

## 2. Manual trace JSONL schema

### 2.1 File format

- One JSON object per line (JSONL)
- Lines may be skipped if invalid JSON or invalid event shape
- AgentInspect does **not** automatically rewrite old trace files

### 2.2 Current schemaVersion

Manual trace events use:

- **`schemaVersion: "0.1"`**

Existing `0.1` traces remain readable in v1.0.

### 2.3 TraceEvent union

The stable event names are:

- `run_started`
- `run_completed`
- `step_started`
- `step_completed`

There is **no** `step_failed` event. Failures are represented by `step_completed` with `status: "error"`.

### 2.4 Common fields

Every trace line contains:

- `schemaVersion: "0.1"`
- `event: string`
- `timestamp: number` (ms since epoch)

## 3. Event definitions

### 3.1 `run_started`

```ts
{
  schemaVersion: "0.1",
  event: "run_started",
  timestamp: number,
  runId: string,
  name: string,
  startTime: number,
  metadata?: Record<string, unknown>
}
```

### 3.2 `run_completed`

```ts
{
  schemaVersion: "0.1",
  event: "run_completed",
  timestamp: number,
  runId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string, stack?: string }
}
```

### 3.3 `step_started`

```ts
{
  schemaVersion: "0.1",
  event: "step_started",
  timestamp: number,
  runId: string,
  stepId: string,
  parentId?: string,
  name: string,
  type: "run" | "llm" | "tool" | "decision" | "logic" | "state" | "custom",
  startTime: number,
  metadata?: Record<string, unknown>
}
```

### 3.4 `step_completed`

```ts
{
  schemaVersion: "0.1",
  event: "step_completed",
  timestamp: number,
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string, stack?: string }
}
```

## 4. Error representation

- Errors are structured as `{ message, stack? }`.
- AgentInspect prints short human errors by default; verbose modes may include stack strings.

## 5. Status representation

Manual trace statuses:

- Run: `status: "success" | "error"` on `run_completed`
- Step: `status: "success" | "error"` on `step_completed`

There is no `"unknown"` status in the persisted manual trace event itself; `"unknown"` can appear in **derived metadata** when status cannot be determined safely.

Unknown status must **not** be treated as success.

## 6. Metadata policy

- Runs may include `metadata` on `run_started`.
- Steps may include `metadata` on `step_started`.
- Manual traces intentionally avoid full prompt/output capture by default.

## 7. Additive fields and unknown fields

- Additive changes are allowed in minor versions.
- Readers should ignore unknown fields where safe.
- Breaking schema changes require a major version.

## 8. Malformed lines

Manual trace reading:

- invalid JSON lines are skipped
- JSON objects that fail strict `TraceEvent` validation are skipped

## 9. Backward compatibility

- v0.1 JSONL traces remain readable in v1.0.
- No automatic migrations or rewriting of old files.

## 10. Breaking change policy

- Breaking changes require a major version.
- Stable v1.x policy: avoid removing stable fields/events; prefer additive extensions.

## 11. Log-derived InspectEvent model

Log-derived events normalize into:

```ts
interface InspectEvent {
  eventId: string;
  runId: string;
  parentId?: string;
  name: string;
  kind: "RUN" | "AGENT" | "LLM" | "TOOL" | "CHAIN" | "RETRIEVER" | "DECISION" | "RESULT" | "ERROR" | "LOGIC" | "LOG";
  timestamp: number;
  status?: "running" | "ok" | "error";
  durationMs?: number;
  attributes?: Record<string, unknown>;
  confidence: "explicit" | "correlated" | "heuristic" | "unknown";
  source: { type: "manual" | "json-log" | "log4js" | "pino" | "winston" | "adapter"; file?: string; line?: number };
}
```

## 12. Confidence labels (required)

Log-derived trees must remain honest:

- `explicit`: parent relationship is directly known (parentId, adapter parent, etc.)
- `correlated`: grouped by run id / request id keys
- `heuristic`: inferred from patterns (used sparingly)
- `unknown`: missing key evidence (e.g. missing timestamp)

## 13. Redaction considerations

Redaction is applied to log-derived attributes and to exports by default. Manual trace metadata is user-controlled and should be treated as potentially sensitive.

See: `docs/architecture/REDACTION.md`.

## 14. Migration notes

- Minor releases may add optional fields/events, but must keep existing v0.1 traces readable.
- Migration guides (v0.1 → v1.0) are out of scope for this pass, but this document is the canonical schema reference for that future guide.

