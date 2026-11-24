---
"agent-inspect": patch
---

Extend timeout-ledger-effects with Kyle pre-call request/idempotency identity and separately correlated effect read-back (landed / did-not-land / stale / foreign / conflicting / retry reuse), keeping observation execution status distinct from external state (N5).
