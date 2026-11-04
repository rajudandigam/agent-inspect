# ADR-0013 — Receipt-scope policy hold (#437 / #484)

**Status:** Accepted hold (no new semantics until fields are decided)  
**Date:** 2026-11-04  
**Related:** [#437](https://github.com/rajudandigam/agent-inspect/issues/437), [#484](https://github.com/rajudandigam/agent-inspect/issues/484), [PROPOSED-437-receipt-idempotency-contract.md](../implementation/active/PROPOSED-437-receipt-idempotency-contract.md), path-scrubbed `-003` evidence under `docs/evidence/otlp-identity-003-2026-10-29/`

## Context

OTLP identity fidelity for operation/attempt linkage shipped in 6.31.22–6.31.23. Synthetic UNPROVABLE fixtures and a conformance checker exist for duplicate receipts and missing `attemptId`. Partner acceptance of the path-scrubbed `-003` packet and Swapnil field decisions for receipt-scope / idempotency remain open.

## Decision

Do **not** extend receipt-join semantics, TraceContract evaluators, or public schema writers until maintainers decide:

1. Which receipt-scope fields are required vs optional at the operation grain.
2. How duplicate same-scope receipts map to UNPROVABLE vs ATTRIBUTABLE without inventing attempt IDs.
3. Whether `-003` handoff acceptance closes #484 independently of #437 field choices.

Until then: keep proposed contract docs and Roy fixtures as conformance inputs only; no production billing claims; no invented `attemptId`.

## Consequences

- `-003` partner acceptance and #437 field decisions stay on the residual queue.
- Checker `scripts/check-roy-437-unprovable.mjs` evaluates positive controls but does not ship new core APIs.
- EVIDENCE_GATE / 6.32 remain blocked on separate gates (including Indu v3 artifact availability).
