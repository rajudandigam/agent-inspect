# Schema (AgentInspect 1.x)

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

Existing `0.1` traces remain readable across AgentInspect 1.x.

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
- **Correlation metadata (v1.3.0+):** optional `correlationId`, `requestId`, `decisionId`, and `groupId` on `run_started.metadata` when passed via `inspectRun` / `maybeInspectRun` options. Event names remain unchanged (`run_started`, `step_started`, `step_completed`, `run_completed`). CLI list/view does not filter by correlation fields yet.
- Steps may include `metadata` on `step_started`.
- Manual traces intentionally avoid full prompt/output capture by default.
- **Redaction (default on):** before disk, `inspectRun` / `step` redact sensitive keys using the shared `Redactor` defaults (`authorization`, `cookie`, `token`, `apiKey`, `password`, `secret`, `email`). Opt out with `redact: false`.
- **Redaction profiles (v1.3.0+):** optional `redactionProfile` (`local`, `share`, `strict`) adds preset extra keys and tighter metadata bounds for trace writing. Key-based only — not compliance-grade DLP. `export --redaction-profile` applies profiles to export copies without mutating source JSONL.
- **Size bounds:** long string values are truncated (`maxMetadataValueLength`, default 2000; preview-like keys use `maxPreviewLength`, default 500). Serialized events are capped at `maxEventBytes` (default 65536 UTF-8 bytes). If still too large, `metadata` may be replaced with `{ truncated: true, reason: "maxEventBytes", originalApproxBytes: number }`. Required event fields are never removed.

## 7. Additive fields and unknown fields

- Additive changes are allowed in minor versions.
- Readers should ignore unknown fields where safe.
- Breaking schema changes require a major version.

## 8. Malformed lines

Manual trace reading:

- invalid JSON lines are skipped
- JSON objects that fail strict `TraceEvent` validation are skipped

## 9. Backward compatibility

- v0.1 JSONL traces remain readable across AgentInspect 1.x.
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

Redaction is applied to **log-derived attributes**, **manual trace metadata (before disk, by default)**, and **exports by default**.

- Manual metadata redaction uses exact key matching (case-insensitive), not substring matching.
- `redact: false` is an explicit opt-out; use only when you accept local persistence of metadata as provided.
- Local trace files can still contain sensitive data if you use non-default key names or opt out of redaction.

Always review any exported content (Markdown/HTML/OpenInference/OTLP JSON) before sharing, especially if you enable richer attribute inclusion.

See: `SECURITY.md` and `docs/API.md` (`InspectRunOptions.redact`, size bound options).

## 14. Persisted InspectEvent schemaVersion "0.2" — experimental foundation

v1.2.0 introduces a **source-agnostic persisted event model** as an experimental foundation. It is **not** the default on-disk format.

| Topic | Rule |
| ----- | ---- |
| Default write format | Manual traces still use **`schemaVersion: "0.1"`** (`run_started`, `step_started`, `step_completed`, `run_completed`). |
| v0.2 role | Unified persisted shape for manual traces, log-derived events, adapter events, and future AI SDK / OTel mappings. |
| v0.2 file writing | **Not enabled by default** in v1.2.0 — converters and fixtures only. |
| v0.1 compatibility | v0.2 does **not** replace v0.1 in this release; existing `0.1` files remain canonical for CLI write/read today. |
| Failures | Still **no** `step_failed`; use `status: "error"` on the persisted event. |

Canonical samples: `fixtures/traces-v0.2/*.jsonl` (validated by `pnpm fixtures:check`).

### 14.1 Field reference (compact)

| Field | Required | Notes |
| ----- | -------- | ----- |
| `schemaVersion` | yes | `"0.2"` |
| `eventId` | yes | Stable per-event identifier |
| `runId` | yes | Run grouping key |
| `parentId` | no | Explicit nesting only when present |
| `kind` | yes | `InspectKind` (`RUN`, `LLM`, `TOOL`, `LOGIC`, …) |
| `name` | yes | Human-readable step label |
| `status` | no | `running` \| `ok` \| `error` \| `unknown` |
| `timestamp` | yes | ISO-8601 string (event time) |
| `startedAt` / `endedAt` | no | ISO-8601 bounds when known |
| `durationMs` | no | Non-negative milliseconds when known |
| `confidence` | yes | `explicit` \| `correlated` \| `heuristic` \| `unknown` |
| `source` | yes | `{ type, name?, version? }` — `manual`, `json-log`, `log4js`, `adapter`, `ai-sdk`, `otel` |
| `attributes` | no | Shallow metadata bag (redaction-ready) |
| `inputSummary` / `outputSummary` | no | Truncated previews when explicitly captured |
| `error` | no | `{ name?, message, code? }` when `status: "error"` |
| `tokenUsage` | no | `{ input?, output?, total? }` when known |
| `trace` | no | Optional `{ traceId?, spanId?, parentSpanId? }` for future OTel alignment |

Programmatic helpers: see [API.md](./API.md) §11 (experimental persisted-event foundation).

## 15. Migration notes

- Minor releases may add optional fields/events, but must keep existing v0.1 traces readable.
- Migration guides (v0.1 → v0.2 file format) are future work; storage/CLI dual-read is not in the v1.2.0 foundation release.

