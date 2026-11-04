# Refund value / entity checks (recipe-local rules)

Demonstrates Frank/Firat-style refund **ceiling**, **entity bind**, and **conditional approval** using the public `TraceCheckRule` + `runTraceChecks` extension API ([discussion #527](https://github.com/rajudandigam/agent-inspect/discussions/527)).

Native TraceContract argument operators remain `exists | type | equals | oneOf`. The illustrative `lte` / `from` syntax in that discussion is **not** a shipped CLI/contract API. `check --config` does not inject arbitrary custom rule code.

## Units

Amounts are finite **USD numbers** (`typeof number`). Strings are never coerced into money.

## Policy (recipe-local)

| Rule | Meaning |
| --- | --- |
| `recipe.refund.amount-ceiling` | `issue_refund.amount` ≤ 100 USD |
| `recipe.refund.entity-bind` | refund `orderId` equals **first** `lookup_order.orderId` in the **same** `runId` |
| `recipe.refund.approval-gate` | amount > 50 USD requires finished `record_approval` for that order with `authorized: true` |

## Run

```bash
pnpm --filter agent-inspect-recipe-refund-value-entity-checks start
```

Synthetic fixtures only. An independent in-memory ledger shows that uninstrumented side effects need reconciliation outside the trace.
