# Sessions and workflow causality — v2.4.0 RFC

**Status:** Accepted for v2.4.0 train (chunk 0) — design only; no runtime implementation in this chunk  
**Audience:** Maintainers, adapter authors, CLI/check implementers  
**Baseline:** `agent-inspect@2.3.0`  
**Related:** [SCHEMA.md](../SCHEMA.md) · [TRACE-CHECKS.md](./TRACE-CHECKS.md) · [V2-TO-V3-ARCHITECTURE-GUIDE.md](../implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md) · [V2.4.0-EXECUTION-PLAN.md](../implementation/release-trains/V2.4.0-EXECUTION-PLAN.md)

This RFC defines an **additive** session and workflow causality vocabulary for multi-run agent systems before v2.4 runtime work (session index, CLI, search/checks, MCP telemetry). It does **not** change default write formats, introduce a new persisted schema, or specify MCP gateway/server products.

---

## 1. Problem

Real agent systems span **multiple runs**, **retries**, **handoffs**, **sub-agents**, **queues**, and **MCP tool calls**. Today AgentInspect supports:

- per-run execution trees;
- optional correlation metadata (`correlationId`, `requestId`, `decisionId`, `groupId`) on `run_started`;
- explicit `parentId` nesting within a run;
- schema 1.0 persisted events with `confidence` and `source`.

What is missing is a **stable, explicit vocabulary** for linking runs into sessions and workflows without inventing structure from timestamps or breaking old traces.

---

## 2. Goals (v2.4.0)

- One additive metadata vocabulary for session/workflow relationships.
- Explicit **source** and **confidence** on every derived edge.
- **Warnings** when relationships are ambiguous — never silent fabrication.
- **Old trace readability** — v0.1, v0.2, and v1.0 files remain valid without migration.
- Clear **MCP telemetry boundary** — client call semantics only; no gateway/server product.

## 3. Non-goals (v2.4.0)

- No schema-breaking rewrite or new `schemaVersion`.
- No timestamp-only causality inference.
- No automatic migration of on-disk files.
- No hosted dashboard, upload pipeline, replay/cassette, or cost engine.
- No MCP gateway, MCP server, tool-invocation server, or automatic remediation.
- No raw chain-of-thought capture.
- No root/core dependency on MCP SDKs.

---

## 4. Placement — where fields live

All fields in this RFC are **optional metadata**. They do not replace event names or required persisted fields.

| Write path | Primary placement | Notes |
| ---------- | ----------------- | ----- |
| Manual v0.1 traces | `run_started.metadata` and optional `step_started.metadata` | Same pattern as correlation metadata (v1.3.0+) |
| Persisted v0.2 / v1.0 | `attributes` on `PersistedInspectEvent` | Preserved through readers; unknown keys kept where safe |
| Adapter/log-derived | `InspectEvent.attributes` | Adapters supply explicit values; readers normalize |
| MCP telemetry (chunk 4) | tool-span `attributes` + `source` | Client-side only; see §10 |

**Rule:** Session/workflow fields are **never required** for a valid trace. Missing fields mean “unknown / not provided,” not failure.

---

## 5. Field vocabulary

### 5.1 Session and conversation

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `sessionId` | string | Stable id for a user/session thread spanning one or more runs |
| `conversationId` | string | Narrower chat/thread id within a session when frameworks distinguish session vs conversation |

**Relationship:** `conversationId` MAY equal `sessionId` when the framework does not split them. Index helpers MUST NOT assume inequality.

### 5.2 Grouping and workflow hierarchy

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `groupId` | string | Existing correlation grouping (v1.3.0+); still valid for batch/eval cohorts |
| `parentGroupId` | string | Parent group when a run belongs to a nested workflow segment |
| `workflowName` | string | Named workflow/orchestration (e.g. `support-triage`, `rag-pipeline`) |
| `workflowStep` | string | Step label within `workflowName` (e.g. `plan`, `retrieve`, `respond`) |

**Compatibility:** `groupId` on existing traces continues to work. New fields extend grouping; they do not redefine `groupId`.

### 5.3 Attempts, retries, and reruns

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `attempt` | number | 1-based attempt index within a logical unit of work |
| `retryOf` | string | `runId` or `eventId` of the prior failed attempt being retried |
| `retryReason` | string | Optional bounded reason code or short label (not full stack traces) |

**Rules:**

- `retryOf` MUST reference an id supplied by the producer when `confidence` is `explicit`.
- When only `attempt > 1` is present without `retryOf`, index helpers MAY group by `(sessionId|groupId, workflowStep, attempt)` with `confidence: "correlated"` and emit a warning.
- Never infer `retryOf` from temporal proximity alone.

### 5.4 Handoffs and sub-agents

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `handoffFrom` | string | Source agent/run/step id handing work off |
| `handoffTo` | string | Target agent/run/step id receiving work |
| `subAgentId` | string | Identity of delegated sub-agent for this run or step |
| `subAgentName` | string | Human-readable sub-agent label |

**Handoff edge model (index time):**

```
handoff: { from, to, source, confidence, warnings? }
```

- `from` / `to` prefer explicit `handoffFrom` / `handoffTo` on metadata.
- If only `subAgentId` is present on a child run linked by `parentGroupId` or `groupId`, emit edge with `confidence: "correlated"` and warning `ambiguous-handoff-endpoints`.

### 5.5 Jobs and queues

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `jobId` | string | Async job or task id from the orchestrator |
| `queueName` | string | Queue or topic name when work is queued |

These fields support worker/orchestrator workflows without implying a message broker integration.

### 5.6 Tool-call correlation

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `toolCallId` | string | Stable id for a tool invocation within a run |
| `mcpToolCallId` | string | MCP-specific call id when distinct from framework tool id |
| `linkedStepId` | string | Explicit link to a `stepId` / `eventId` when the producer knows it |

**Rule:** Tool spans correlate to parent LLM/agent steps only when `parentId`, `linkedStepId`, or adapter-supplied explicit linkage exists. Otherwise surface `unknown-tool-parent` warning.

---

## 6. Source and confidence rules

Every session index edge or aggregation MUST record:

| Property | Values |
| -------- | ------ |
| `source` | `manual` \| `adapter` \| `json-log` \| `log4js` \| `mcp-client` \| `inferred` |
| `confidence` | `explicit` \| `correlated` \| `heuristic` \| `unknown` |

**Frozen rules for v2.4:**

| Situation | confidence | source |
| --------- | ---------- | ------ |
| Field present on `run_started.metadata` or persisted `attributes` from writer | `explicit` | `manual` or adapter type |
| Same `sessionId` / `groupId` across runs with no handoff fields | `correlated` | `inferred` |
| `attempt` without `retryOf` | `correlated` | `inferred` + warning |
| Parent/child only via timestamps | **forbidden** | — |

**Never** promote `heuristic` or timestamp proximity to `explicit` without maintainer-approved RFC change.

---

## 7. Ambiguity warnings

Index helpers and CLI diagnostics MUST emit stable warning codes (non-fatal):

| Code | When |
| ---- | ---- |
| `missing-session-id` | Session view requested but no `sessionId` on any run in scope |
| `ambiguous-handoff-endpoints` | Handoff implied by grouping only |
| `ambiguous-retry-link` | `attempt > 1` without `retryOf` |
| `unknown-tool-parent` | Tool/MCP span without explicit parent linkage |
| `mixed-confidence-group` | Group aggregates runs with conflicting explicit vs inferred edges |
| `timestamp-only-sibling` | Sibling runs share time overlap but no shared ids — **do not link**; warn only |

Warnings are included in `--diagnostics` / JSON output; they do not change trace files.

---

## 8. Old trace compatibility

| Input | Behavior |
| ----- | -------- |
| v0.1 manual JSONL | Fully readable; optional new metadata keys ignored by old CLIs |
| v0.2 persisted JSONL | Fully readable; new keys live in `attributes` |
| v1.0 persisted JSONL | Fully readable; unknown optional fields preserved per schema 1.0 policy |
| Traces with only `correlationId` / `groupId` | Session index treats as **correlated** session grouping; no upgrade required |
| Traces with no session fields | Single-run inspection unchanged; session commands return empty or not-found |

No automatic rewrite. Producers opt in by writing metadata; consumers opt in via session-aware commands (chunks 1–3).

---

## 9. Critical path and ordering (chunk 1 preview)

Runtime chunk 1 will implement:

- deterministic ordering: explicit `startedAt` / `timestamp`, then `runId`, then `eventId` tie-break;
- critical path over **explicit** parent/handoff edges first;
- fallback correlated edges labeled in output;
- no timestamp-only invented causality.

This RFC does not implement critical path — it constrains how chunk 1 may build graphs.

---

## 10. MCP semantic boundary (telemetry only)

v2.4 chunk 4 may add **local MCP client tracing** with these semantics:

| In scope | Out of scope |
| -------- | ------------ |
| Wrap MCP **client** `tools/list`, `tools/call` | MCP **server** implementation |
| Record server identity (name/url hash), tool name, bounded arg/result summaries, duration, errors | Gateway, proxy, or hosted MCP broker |
| Attach `sessionId`, `toolCallId`, `mcpToolCallId`, `source.type: mcp-client` | Invoke tools on behalf of the user from AgentInspect |
| Emit warnings on oversized payloads (truncate) | Upload traces by default |

MCP rows are **tool-kind** persisted/inspect events with `source` metadata — not a new schema version.

---

## 11. Mapping to checks, search, and cohort (chunks 3+)

- `search --session <id>` filters by `sessionId` with exact match; falls back to `groupId` only when documented and flagged `correlated`.
- Check rules may reference session/group evidence; group-level failures cite `runId` + warning codes.
- Cohort `group-by session|group` is optional; minimum v2.4 deliverable is session-aware grouping helpers if cohort CLI is absent.

---

## 12. Implementation sequence (v2.4 train)

| Chunk | Deliverable |
| ----- | ----------- |
| 0 (this RFC) | Vocabulary, compatibility, MCP boundary |
| 1 | `buildSessionIndex`, fixtures, tests |
| 2 | `sessions` / `session` CLI |
| 3 | Session-aware search/checks |
| 4 | `@agent-inspect/mcp` or subpath — client telemetry |
| 5 | Docs, recipes, release readiness |

---

## 13. Acceptance (chunk 0)

- [x] Additive fields only; no schema version change
- [x] Source/confidence and ambiguity policy documented
- [x] Timestamp-only causality forbidden
- [x] MCP gateway/server explicitly out of scope
- [x] Old traces remain readable without migration
