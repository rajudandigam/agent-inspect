# Refund value / entity checks (recipe-local rules)

Demonstrates Frank/Firat-style refund **ceiling**, **entity bind**, and **conditional approval** using the public `TraceCheckRule` + `runTraceChecks` extension API ([discussion #527](https://github.com/rajudandigam/agent-inspect/discussions/527)).

Native TraceContract argument operators remain `exists | type | equals | oneOf`. The illustrative `lte` / `from` syntax in that discussion is **not** a shipped CLI/contract API. `check --config` does not inject arbitrary custom rule code.

## Units

Amounts are finite **USD numbers** (`typeof number`). Strings are never coerced into money.

## Policy (recipe-local)

| Rule | Meaning |
| --- | --- |
| `recipe.refund.amount-ceiling` | Each finished or **attempted (running)** `issue_refund.amount` ≤ 100 USD (per-call, not cumulative) |
| `recipe.refund.entity-bind` | refund `orderId` binds to a same-`runId` `lookup_order` with matching `orderId` (and `operationId` when declared); refuse ambiguous conflicting candidates; unrelated earlier lookups do not steal the join |
| `recipe.refund.approval-gate` | amount > 50 USD requires `record_approval` with `status=ok`, `authorized=true`, matching identity, **completed before** the refund starts |

Negative-amount domains and cumulative ceilings are deliberately not universalized here.

## Run

```bash
pnpm --filter agent-inspect-recipe-refund-value-entity-checks start
```

Synthetic fixtures only. An independent in-memory ledger shows that uninstrumented side effects need reconciliation outside the trace.
