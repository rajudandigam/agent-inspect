# Sessions and Activity — v4.2.0 RFC

**Status:** Accepted for v4.2.0 train (chunk 0) — design only; no runtime implementation in this chunk  
**Audience:** Maintainers, CLI implementers, index integration authors  
**Baseline:** `agent-inspect@4.1.0`  
**Builds on:** [SESSIONS-AND-WORKFLOW-CAUSALITY.md](./SESSIONS-AND-WORKFLOW-CAUSALITY.md) (v2.4 vocabulary, shipped)  
**Related:** [OPTIONAL-LOCAL-INDEX.md](./OPTIONAL-LOCAL-INDEX.md) · [V4.2.0-EXECUTION-PLAN.md](../implementation/release-trains/V4.2.0-EXECUTION-PLAN.md)

This RFC defines the **v4.2.0 delta** on top of the existing session index (`buildSessionIndex`, `sessions` / `session` CLI from v2.4). It adds **session status**, **activity summaries**, **expanded CLI**, and **optional index acceleration** — without changing trace schema, inventing relationships, or adding network behavior.

---

## 1. Problem

Developers can already list sessions and inspect handoffs/retries (v2.4), but multi-run agent activity is still hard to scan at a glance:

- no unified **session status** (running vs stale vs error);
- no **activity feed** across recent sessions;
- no single command for **latest session**, **session errors**, or **handoff overview**;
- large trace directories re-scan every JSONL file even when an index exists.

v4.2 makes sessions and activity **first-class local concepts** for day-to-day debugging.

---

## 2. Goals (v4.2.0)

- Derive a deterministic **session status** from explicit run metadata and run completion state.
- Produce **activity summaries** (today / last N days) from session aggregates.
- Expand CLI with `sessions latest`, `sessions activity`, `sessions show`, `sessions handoffs`, `sessions errors` (JSON mode on all).
- **Accelerate** session listing when `@agent-inspect/index-sqlite` is installed and healthy; **fall back** to directory scan when absent, stale, or corrupt.
- Preserve v2.4 rules: explicit metadata first, confidence labels, ambiguity warnings, **no timestamp-only causality**.

## 3. Non-goals (v4.2.0)

- No new `schemaVersion` or trace format change.
- No timestamp-only parent/child or handoff inference.
- No hosted session store, upload, or daemon.
- No semantic/vector search.
- No required SQLite dependency in root/core.
- No new root value exports unless explicitly approved in a later chunk.

---

## 4. Session status model

Each `SessionSummary` (extended) carries a derived `status`:

| Status | Meaning |
| ------ | ------- |
| `running` | At least one run in the session has status `running` |
| `waiting_input` | Explicit metadata `sessionStatus: "waiting_input"` on any run (producer-supplied) |
| `idle` | Explicit metadata `sessionStatus: "idle"` on any run |
| `completed` | All runs completed with status `success` and none `running` |
| `error` | At least one run completed with status `error` and none `running` |
| `stale` | No run `running`, but `lastActivity` older than configurable threshold (default 24h) while status would otherwise be `running`-like ambiguity — or explicit `sessionStatus: "stale"` |
| `unknown` | Insufficient metadata to classify |

**Derivation order (deterministic):**

1. If any run `status === "running"` → `running`.
2. Else if any run metadata has explicit `sessionStatus` in the allowed set → use the highest-priority explicit value (`error` > `waiting_input` > `idle` > `stale` > `completed`).
3. Else if any run `status === "error"` → `error`.
4. Else if all runs `status === "success"` → `completed`.
5. Else if `lastActivity` + `staleThresholdMs` < now → `stale`.
6. Else → `unknown`.

`staleThresholdMs` defaults to `86_400_000` (24h). CLI `--stale-after` accepts duration syntax (`30m`, `2h`, `7d`).

---

## 5. Extended session fields

`SessionSummary` gains additive derived fields (not written to traces):

```text
status          SessionStatus
startedAt       earliest run startedAt
endedAt         latest run endedAt (if all ended)
durationMs      endedAt - startedAt when both present
correlationId   from first run with explicit correlationId
jobId           from first run with explicit jobId
workflowId      workflowName or workflowStep when present
lastError       { runId, message, code? } from latest error run
lastActivity    ISO timestamp of newest run startedAt or endedAt
handoffs        (existing)
attempts        retry links (existing retries, renamed in output)
retryCount      count of retries with attempt > 1 or retryOf
observationSummary  bounded string from check/observation metadata when present
checkSummary    { pass, fail, warn } counts when check artifacts referenced
```

All fields are **read-time derived**. Missing data → `null` / empty, never fabricated.

---

## 6. Activity summaries

`buildActivitySummary(index, options)` returns:

```ts
interface ActivitySummary {
  since: string;           // ISO cutoff
  sessions: number;
  failed: number;
  stale: number;
  guardrailWarnings: number;  // from metadata/check hints when present
  entries: ActivityEntry[];   // sorted newest first
}

interface ActivityEntry {
  sessionId: string;
  status: SessionStatus;
  summary: string;         // one-line human summary
  lastActivity: string;
  runCount: number;
}
```

**Human rendering** (default CLI):

```text
Today
  support-agent session abc123 failed at refund-policy tool
  browser-agent session def456 completed with observation warning

Last 7 days
  42 sessions
  6 failed
  3 stale
  8 guardrail warnings
```

Entries are capped (default 20) for terminal output; JSON returns full bounded list.

---

## 7. CLI surface (v4.2)

Existing commands remain (`sessions`, `session <id>`). New **subcommands** under `sessions`:

| Command | Purpose |
| ------- | ------- |
| `sessions latest` | Most recently active session (by `lastActivity`) |
| `sessions activity [--since 7d]` | Activity summary for a time window |
| `sessions show <sessionId>` | Alias for `session <id>` with v4.2 enriched fields |
| `sessions handoffs [--session <id>]` | All handoff edges; optional filter |
| `sessions errors [--since 7d]` | Sessions/runs with errors in window |

All accept `--dir`, `--json`, `--correlate-group` (existing flag). Exit codes: `0` success, `1` not found / no data, `2` invalid args.

**Backward compatibility:** `agent-inspect sessions` and `agent-inspect session <id>` keep working unchanged; new subcommands are additive.

---

## 8. Index acceleration + scan fallback

When `@agent-inspect/index-sqlite` is installed:

1. Resolve index path via `resolveIndexDbPath(traceDir)`.
2. If `indexStatus(dbPath).healthy && !isIndexStale(...)` → load runs from index (`queryRuns` + session_id filter) and build session index from indexed rows.
3. Else → existing scan path (`TraceDirectory.list` + `loadSessionRunRecords`).

**Parity rule:** indexed and scan paths MUST produce identical `SessionIndex` for the same inputs (modulo ordering tie-breaks). Tests cover both paths.

Index is **never required**. Missing package → scan only, no error (unless user invoked an index-only debug flag — not in v4.2 scope).

---

## 9. Placement in codebase

| Area | Change |
| ---- | ------ |
| `packages/core/src/sessions/` | `status.ts`, `activity.ts`; extend `SessionSummary`, `buildSessionIndex` post-process |
| `packages/cli/src/sessions.ts` | Subcommand routing; activity/latest/errors/handoffs |
| `packages/index-sqlite/` | Optional read path only; no schema change |
| `fixtures/sessions/` | Status, stale, activity fixtures |
| `docs/` | CLI reference, activity guide |

Core session APIs remain on `agent-inspect/advanced` (existing export). No new root subpath in v4.2 unless a later chunk proves necessary.

---

## 10. Tests (chunks 1–5)

- Session status derivation for each status value.
- Stale detection with configurable threshold.
- Activity summary counts and entry ordering.
- Handoffs/errors filtered views.
- Index vs scan parity on shared fixtures.
- JSON output stability.
- No timestamp-only causality (regression on v2.4 warnings).

---

## 11. Implementation sequence (v4.2 train)

| Chunk | Deliverable |
| ----- | ----------- |
| 0 (this RFC) | Status model, activity shape, CLI table, index fallback policy |
| 1 | Session status + extended `SessionSummary` fields |
| 2 | `buildActivitySummary` + rendering helpers |
| 3 | CLI subcommands + JSON |
| 4 | Index acceleration + parity tests |
| 5 | Docs, fixtures, release readiness |

---

## 12. Acceptance (chunk 0)

- [x] Additive derived fields only; no schema version change
- [x] Status derivation rules documented; no timestamp-only causality
- [x] Activity summary shape and CLI commands specified
- [x] Index optional with scan fallback; parity rule stated
- [x] Builds on v2.4 vocabulary without redefining it
