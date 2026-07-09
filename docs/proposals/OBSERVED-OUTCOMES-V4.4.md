# Observed Outcomes — v4.4.0 RFC

**Status:** Accepted for v4.4.0 train (chunk 0)  
**Audience:** Maintainers, runtime authors, CLI implementers  
**Baseline:** `agent-inspect@4.3.0`  
**Related:** [V4.4.0-EXECUTION-PLAN.md](../implementation/release-trains/V4.4.0-EXECUTION-PLAN.md)

Observed outcomes record whether the **external world** changed as expected — distinct from tool/step success.

---

## 1. Problem

Tool `ok` does not prove a refund policy appeared, a row was written, or a queue job ran. v4.4 adds first-class **outcome observations** that developers assert after side effects.

## 2. Goals

- `observeOutcome(name, { expectation, status, method?, actual?, evidence? })` inside an active run.
- Additive v0.1 event `outcome_observed`; v0.2/v1.0 kind `OUTCOME`.
- Surface outcomes in **report** (`--section observations`), **check** (`--fail-on-observation`), and **search** (`--observation`).
- Redaction and size bounds on `actual` / `evidence`; no raw sensitive payloads by default.

## 3. Non-goals

- No browser/DOM automation built-in
- No schema break; no network/upload
- No replacement of `observe()` (agent proxy wrapper)

## 4. Model

```ts
type ObservedOutcomeStatus = "passed" | "failed" | "unknown" | "skipped";
type ObservedOutcomeMethod =
  | "dom" | "accessibility" | "snapshot" | "network" | "storage"
  | "filesystem" | "database" | "queue" | "custom";
```

v0.1 JSONL (`outcome_observed`):

```json
{
  "schemaVersion": "0.1",
  "event": "outcome_observed",
  "timestamp": 1710000000000,
  "runId": "run-1",
  "outcomeId": "outcome-abc",
  "parentId": "step-xyz",
  "name": "policyShown",
  "expectation": "Refund policy should be visible",
  "status": "passed",
  "method": "custom",
  "evidence": { "selector": "#refund-policy" },
  "observedAt": 1710000000000
}
```

Persisted v0.2 maps to `kind: "OUTCOME"` with `attributes.outcomeStatus`, `expectation`, `method`, `actual`, `evidence`, `observedAt`.

## 5. API

```ts
import { observeOutcome } from "agent-inspect";

await observeOutcome("policyShown", {
  expectation: "Refund policy should be visible",
  status: "passed",
  method: "custom",
  evidence: { selector: "#refund-policy" },
});
```

- Requires active `inspectRun` context; outside a run → warn and no-op (never throws).
- `createInspector` exposes `inspector.observeOutcome` for the persisted writer path.

## 6. CLI

```bash
agent-inspect search --observation failed
agent-inspect report <runId> --section observations
agent-inspect check <runId> --fail-on-observation failed
```

## 7. Check rule

`outcome.status` (id: `outcome.status`) fails when observed outcomes match `--fail-on-observation` statuses (default: `failed`).

## 8. Compatibility

- Traces without outcomes remain valid.
- Readers accept `outcome_observed` and `OUTCOME` alongside existing events.

## 9. Security

- `actual` and `evidence` pass through trace safety bounds and redaction profiles on export.
- No network I/O in outcome path.
