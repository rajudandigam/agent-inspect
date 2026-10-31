# Roy / #437 — synthetic UNPROVABLE conformance cases (2026-10-30)

Partner request (Roy, Oct 29): public synthetic cases where attribution is **UNPROVABLE** rather than guessed.

These fixtures are **conformance inputs** for the proposed receipt/attempt contract ([PROPOSED-437-receipt-idempotency-contract.md](../../implementation/active/PROPOSED-437-receipt-idempotency-contract.md)). They do **not** claim a production billing defect, do **not** invent missing `attemptId` values, and do **not** close [#437](https://github.com/rajudandigam/agent-inspect/issues/437) or the `-003` handoff.

| Case | Intent | Expected metering / attribution |
| --- | --- | --- |
| [A-duplicate-receipt-delivery](A-duplicate-receipt-delivery.json) | Same `receiptId` delivered twice in one scope | **UNPROVABLE** for exactly-once billable attribution; both deliveries retained; control with distinct receipt stays attributable |
| [B-missing-attempt-identity](B-missing-attempt-identity.json) | Operation-grain attribution requested without `attemptId` | **UNPROVABLE**; complete-identity control remains attributable |

Validate:

```bash
node scripts/check-roy-437-unprovable.mjs
```

`-003` inventory/mapping acceptance remains pending; `-002` stays frozen.
