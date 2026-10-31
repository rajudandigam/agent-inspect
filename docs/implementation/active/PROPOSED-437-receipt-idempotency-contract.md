# PROPOSED — Bounded receipt / idempotency contract (#437)

## Status

**Proposed — not agreed, not approved, not implemented.**

This document is an artifact-first design slice for GitHub issue **#437** (receipt / idempotency evidence). It does not change public APIs, schema 1.0 writers, or TraceContract evaluators until a maintainer accepts a follow-on chunk.

## Context

AgentInspect already evaluates **trace-side attempt identity** (`operationId`, `attemptId`, `idempotencyKey`, …) under TraceContract `retry` rules ([ADR-0010](../decisions/ADR-0010-structured-control-contracts.md), [ADR-0011](../decisions/ADR-0011-bounded-safe-recovery.md)). That path records **client or agent intent** and retry-shape evidence. It does **not** model what a **counterparty** (tool host, workflow store, external ledger adapter, correspondence index) returned as a durable receipt.

Partner workflows need a **bounded, local, joinable contract** so traces, frozen fixtures, and Evidence v2 can assert:

- whether a declared idempotency key on an attempt **aligns** with a recorded receipt in a declared scope;
- whether joins are **supported**, **unknown**, or **conflicting**—without live network fetches, payment-rail semantics, or exactly-once claims.

Prior art in-repo: Keniel finding-B8 maps **correspondence-reported** receipt locatability with explicit join keys and `unmatched_join` / `not_found_in_search` honesty (`examples/recipes/keniel-finding-b8/`). This proposal generalizes that pattern into a reusable **receipt record** shape and **join diagnostics** for #437 fixtures.

## Goals

1. Define a **proposed** normalized **CounterpartyReceipt** record and **ReceiptScope** so fixtures and future readers can join trace attempts to recorded outcomes deterministically.
2. Keep **TraceIntent** (what the agent logged) and **CounterpartyOutcome** (what the counterparty record claims) as separate planes; joins are evidence, not proof of external truth.
3. Specify **bounded representation**, **producers**, and **conflict handling** for each field.
4. Lock **required fixture controls** for the next agreed slice (synthetic data only).

## Non-goals

- No claim of **payment verified**, **settlement**, **authorization hold**, or **exactly-once** side effects.
- No real receipt payloads, PANs, rail messages, or production counterparty identifiers in repo fixtures.
- No rail SDK, PSP API, or default network I/O in evaluators or recipes.
- No schema 1.1, no new root exports, no retry execution engine.
- Not an ADR acceptance; not contributor sign-off.

---

## Two-plane model (normative for this proposal)

| Plane | Name | Producer (typical) | What it represents |
| --- | --- | --- | --- |
| **A** | **TraceIntent** | Agent runtime / adapter capture on TOOL (or LOGIC) events | Declared `operationId`, `attemptId`, `idempotencyKey`, tool name, optional argument digest—**intent and attempt grouping** only ([SESSIONS-AND-OUTCOMES.md](../../SESSIONS-AND-OUTCOMES.md)). |
| **B** | **CounterpartyReceipt** | Fixture author, importer, or offline index bundled with Evidence | A **bounded record** that a counterparty **would have stored** or that correspondence **reports** as locatable—**recorded outcome metadata**, not live verification. |

**Join** = correlated link from a TraceIntent event (or operation group) to zero or more CounterpartyReceipt rows under an explicit **ReceiptScope**. A successful join means **keys and scope align in the fixture**; it does not mean the counterparty was contacted during evaluation.

Evaluators (future) should emit **findings/diagnostics**, never mutate traces or call external systems.

---

## Proposed record: `CounterpartyReceipt`

All string fields: trim whitespace; empty after trim → treat as **absent**. Max lengths below are **serialization bounds** for fixtures and future persisted sidecars (not yet schema 1.0).

### `receiptId` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Counterparty system or fixture author simulating counterparty storage. |
| **Semantics** | Opaque stable identifier of **this receipt row** within the counterparty’s namespace (not the same as `idempotencyKey`). Uniqueness is asserted **per scope** (see scope). |
| **Bounded representation** | Non-empty string, max **128** chars; `[A-Za-z0-9._:-]+` recommended; no raw payment tokens. |
| **Conflict handling** | Two rows with the same `receiptId` in the **same scope** → **`duplicate_receipt`** (both retained; marked conflicting). Same `receiptId` in **different scopes** → allowed; no automatic conflict. |

### `idempotencyKey` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Client/agent on TraceIntent **and** counterparty on receipt (counterparty may echo or map). |
| **Semantics** | Dedup **correlation key** the client intended for one logical mutation attempt. On the receipt plane, documents what the counterparty **associated** with the stored outcome—not proof the server deduplicated correctly. |
| **Bounded representation** | Non-empty string, max **256** chars; same charset recommendation as `receiptId`. |
| **Conflict handling** | See [Conflict catalog](#conflict-catalog) (`key_drift_within_operation`, `key_reuse_across_operations`, cross-scope reuse). |

### `operationId` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Agent trace (TraceIntent) **and optionally** counterparty receipt if their store mirrors agent grouping. |
| **Semantics** | Groups attempts belonging to one logical operation. On receipt plane, optional **foreign correlation** to trace `operationId`; absence means join relies on `idempotencyKey` + scope only. |
| **Bounded representation** | String max **128** chars; absent allowed on receipt. |
| **Conflict handling** | Same `idempotencyKey` + same scope + **different** non-empty `operationId` on receipts → **`receipt_operation_mismatch`**. Trace `operationId` differs from receipt `operationId` on an otherwise key-matched join → **`join_operation_id_mismatch`** (diagnostic; not auto-fail unless contract requires alignment). |

### `status` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Counterparty record or fixture mapper (never inferred from trace TOOL `ok`/`error` alone). |
| **Semantics** | **Recorded outcome class** on the counterparty plane—not execution status on the trace. |
| **Bounded representation** | Enum (closed set for fixtures): `recorded` \| `duplicate_suppressed` \| `rejected` \| `unknown_completion` \| `not_found_in_index` \| `join_unmatched`. |
| **Conflict handling** | Duplicate `receiptId` or same key+scope with incompatible `status` + digest → **`conflicting_receipt_status`**. Trace shows success while receipt is `rejected` → **`intent_outcome_divergence`** (informational/severe per contract tier—not “payment failed”). |

### `receivedAt` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Counterparty clock or fixture author (ISO timestamp). |
| **Semantics** | When the counterparty **claims** the receipt was accepted into their store (not AgentInspect ingest time). |
| **Bounded representation** | ISO 8601 UTC string with milliseconds, max **32** chars; monotonic ordering only within a single fixture table, not trusted globally. |
| **Conflict handling** | Used for ordering duplicate diagnostics only; **no** “latest wins” mutation of trace facts. |

### `provenance` (proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Importer / fixture packager. |
| **Semantics** | How this receipt row entered the evidence bundle. |
| **Bounded representation** | Object: `{ source: "fixture" \| "imported_sidecar" \| "correspondence_report", confidence: "explicit" \| "correlated" \| "unknown", basis?: string[] }` with each basis string max **120** chars, at most **8** entries. |
| **Conflict handling** | Lower confidence never upgrades to explicit; conflicting provenance on duplicate rows → attach to **`duplicate_receipt`** diagnostic. |

### `digest` (optional, proposed)

| Aspect | Definition |
| --- | --- |
| **Producer** | Client (trace argument digest) and/or counterparty (payload fingerprint). |
| **Semantics** | Bounded fingerprint of request/outcome body—**not** full payload. Used to detect same-key different-body conflicts. |
| **Bounded representation** | `{ alg: "sha256", value: string }` where `value` is 64 hex chars; only `sha256` in v1 fixtures. |
| **Conflict handling** | Same scope + same `idempotencyKey` + different digest → **`conflicting_receipt_digest`**. Missing digest when contract requires it → **`receipt_digest_unavailable`** (fail closed for that rule). |

### `scope` — endpoint / target (required for verifiable join, proposed)

Receipt matching is **never global**. Scope must be explicit for a join to be **verifiable**.

| Field | Producer | Semantics | Bounded representation |
| --- | --- | --- | --- |
| **`scope.endpoint`** | Fixture / adapter config | Logical API surface or tool host identity (e.g. `tool:charge`, `mcp:payments/write`). | String max **128** chars. |
| **`scope.target`** | Fixture / tenant config | Partition inside the endpoint (account, workspace, merchant ref **synthetic**). | String max **128** chars. |
| **`scope.version`** (optional) | Fixture | Contract or adapter version for evolution. | String max **32** chars. |

**Scope identity key** (proposed canonical): `endpoint + "\0" + target + "\0" + (version ?? "")`.

| Condition | Handling |
| --- | --- |
| Scope present on receipt and join rule | Keys compared **within** scope identity key only. |
| Scope missing on receipt | Join state **`scope_unknown`** — treat as **unverifiable** (not silently global). |
| Scope missing on trace intent side | **`intent_scope_unspecified`** — cannot assert misuse; may still correlate weakly if contract allows `confidence: correlated`. |
| Same `idempotencyKey`, different scope | **Not** automatic misuse (`cross_scope_key_reuse_allowed`). |

---

## Join model (proposed)

A **ReceiptJoinRule** (future TraceContract or Evidence check—out of scope for this doc) references:

1. TraceIntent selector: `runId`, tool name, `operationId` / event id, optional `idempotencyKey` path.
2. Receipt table: bundled JSON sidecar or fixture array.
3. Required scope alignment: `endpoint` + `target` must match unless rule explicitly allows weak join.

**Join outcomes** (diagnostic codes proposed):

| Code | Meaning |
| --- | --- |
| `join_matched` | Key + scope + optional digest align. |
| `join_absent` | Expected receipt row missing (`not_found_in_index`). |
| `join_unmatched` | Keys present but scope or secondary keys (e.g. comment/article analogue) do not align—Keniel-style. |
| `join_scope_unknown` | Receipt or intent missing scope. |
| `join_conflicting_receipts` | Multiple rows match; disagree on status or digest. |

Trace TOOL `status: ok` **does not** imply `join_matched`.

---

## Conflict catalog

Controls the **next agreed fixture** must exercise (synthetic labels only):

| # | Scenario | Expected diagnostic / status |
| --- | --- | --- |
| 1 | **Key drift within one operation** — same trace `operationId`, attempts carry `idempotencyKey` A then B | `key_drift_within_operation` |
| 2 | **Same key, distinct operations, same scope** — two `operationId`s share one `idempotencyKey` | `key_reuse_across_operations` (same scope) |
| 3 | **Same key, different scopes** | No automatic misuse; both may `join_matched` under respective scopes |
| 4 | **Absent / mismatched join** — key or secondary join dimension wrong | `join_absent` or `join_unmatched` |
| 5 | **Duplicate / conflicting receipts** — duplicate `receiptId` or same key+scope incompatible `status`/digest | `duplicate_receipt` / `conflicting_receipt_status` / `conflicting_receipt_digest` → metering attribution **UNPROVABLE** (both deliveries retained; no guessed billable winner). Synthetic: [`docs/evidence/roy-437-unprovable-2026-10-30/A-duplicate-receipt-delivery.json`](../../evidence/roy-437-unprovable-2026-10-30/A-duplicate-receipt-delivery.json) |
| 6 | **Missing scope** | `scope_unknown` / unverifiable; must not default to global match |
| 7 | **Missing attempt identity** — operation-grain attribution requested without `attemptId` | Attribution **UNPROVABLE** (do not invent `attemptId`). Complete-identity control stays attributable. Synthetic: [`docs/evidence/roy-437-unprovable-2026-10-30/B-missing-attempt-identity.json`](../../evidence/roy-437-unprovable-2026-10-30/B-missing-attempt-identity.json) |

---

## Relationship to existing trace `idempotencyKey`

- Trace attributes remain governed by **retry safety** and **recovery operations** ([TRACE-CONTRACTS.md](../../TRACE-CONTRACTS.md)): client key = **intent evidence**, not counterparty proof.
- This proposal adds an optional **receipt sidecar** and join diagnostics; it does **not** replace or weaken ADR-0011 write-completion unevaluability rules.
- A passing retry-intent check and a failing receipt join (or vice versa) are **both valid** honest states.

---

## Proposed fixture envelope (informative)

For #437 slice 2+ (not implemented here):

```json
{
  "contractVersion": "proposed-437-v0",
  "receiptScope": { "endpoint": "tool:example_write", "target": "tenant-synthetic-01" },
  "traceIntentRef": { "runId": "run-fixture", "operationId": "op-1", "idempotencyKey": "key-1" },
  "receipts": []
}
```

No network fields, no live URLs required at evaluation time.

---

## Open decisions (maintainer)

See parent task summary bullets; acceptance promotes this doc or extracts **ADR-0013** with status **Accepted** and links from [RELEASE-TRAIN-STATE.md](../RELEASE-TRAIN-STATE.md) issue `437`.

---

## References

- Issue **#437** — receipt / idempotency evidence train (W20A)
- [ADR-0010](../decisions/ADR-0010-structured-control-contracts.md) — trace `idempotencyKey` in retry rules
- [ADR-0011](../decisions/ADR-0011-bounded-safe-recovery.md) — intent vs write completion
- [ADR-0012](../decisions/ADR-0012-evidence-contract-binding.md) — Evidence binding boundaries
- Recipe: `examples/recipes/keniel-finding-b8/` — correspondence receipt join honesty
- Recipe: `examples/recipes/structured-control-contracts/` — trace-side idempotency on retry
