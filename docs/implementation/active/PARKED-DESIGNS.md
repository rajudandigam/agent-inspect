# Parked designs (post-6.31.34 residual C16)

> Pointer only. These are **not** authorized implementation chunks. Do not ship them as incidental patches. Deduplicate against open issues before opening a design proposal.

## Parked (needs separate design + maintainer selection)

| Theme | Notes | Overlaps |
| --- | --- | --- |
| Coverage registry + independent reconciliation | Declared instrumentation boundary vs external ledgers | Firat ledger cases; recipe `refund-value-entity-checks` shows the gap only |
| Cross-run operation linkage | Physical run vs business operation joins | #437 / #484 / ADR-0013 hold |
| Optional durable intent journal | Crash/recovery/storage; **not** a default synchronous writer | Writer safety docs; Salvor resumes a durable event log (not a retry/attempt model) |
| Optional trusted signing / sealing | Authenticate bytes; still not completeness or exactly-once | ADR-0012 assurance boundaries |
| General conditional / value comparison operators | After recipe-local TraceCheckRule examples land | #527; `refund-value-entity-checks` |
| Data-flow-aware causal explanations | After explicit dependency links exist | — |
| Repeat-run contract pass-rate threshold | Explicit denominator rules before CLI flags | #527 item 3; do not reuse `gate --max-error-rate` |
| RETRIEVER in `steps.orderRelations` | Additive `StepOrderingKind` design if desired | `retriever-llm-order-otlp` recipe-local rule today |

## Explicit non-claims

- Signed receipts / journaling do **not** create exactly-once side effects.
- Salvor-style durable logs are **not** AgentInspect retry/attempt semantics.
- Elastic C10 live, Docker Collector qualification, and external action-boundary acceptance remain **unmeasured** until actually run.
- **6.32 / v7** stay blocked on their gates (`EVIDENCE_GATE`, `V7_DECISION: NO-GO`).
- Backlog unless separately selected: #489 effect-label provenance; #65 / #66 / #115.

## Shipped local illustrations (not the parked architectures)

- [refund-value-entity-checks](../../../examples/recipes/refund-value-entity-checks/) — recipe-local value/entity/approval rules
- [retriever-llm-order-otlp](../../../examples/recipes/retriever-llm-order-otlp/) — recipe-local RETRIEVER→LLM order over OpenInference
