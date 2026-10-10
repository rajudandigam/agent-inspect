# Recipe: bounded-read-recovery

## What this demonstrates

AgentInspect **6.27** TraceContract `retry.operations[]` for a **read-only**
`retrieve_policy` recovery oracle: same arguments (structured/digest), retryable
error codes, recovered-failure visibility, LLM explicit reference to a result that
was **available before the consumer started**, and a `policyShown` observation.

Also asserts F01 regressions: future/overlapping result references fail
`successful-result-dependency`; partial attempt annotations still count toward
`maxAttempts`; write `ETIMEDOUT`/`TIMEOUT` remain unevaluable (unit tests).

## Paths

| Path | Expected |
| --- | --- |
| `valid-single-read` | PASS — single success + LLM reference + policyShown |
| `valid-recovery` | PASS — TemporaryUnavailable → success, same args, failure visible |
| `two-successes-no-permitted-cause` | FAIL — retry after success without prior failure |
| `nonretryable-error` | FAIL — PermanentDenied then retry |
| `changed-arguments` | FAIL — tenant/policy/version drift across attempts |
| `too-many-attempts` | FAIL — exceeds maxAttempts 2 |
| `future-overlapping-answer` | FAIL — answer starts before tool result available |
| `both-fail-answer-claims-success` | FAIL — no terminal ok |
| `missing-result-link` | FAIL — LLM references wrong/missing event |
| `failed-safety-observation` | FAIL — policyShown outcome failed |

Recipe-level **100ms budget** for the valid paths is a declared fixture check
(not a core TraceContract field).

## How to run

```bash
pnpm build
pnpm --filter agent-inspect-recipe-bounded-read-recovery start
```

Outer harness exits **0** only when every classification matches.

## Notes

- Synthetic fixtures only; no network.
- Schema remains **1.0**.
- Write-tool timeout/unknown/`ETIMEDOUT` completion is unevaluable without
  authoritative reconciliation (unit tests / public recovery gate).
- See [ADR-0011](../../../docs/decisions/ADR-0011-bounded-safe-recovery.md).
