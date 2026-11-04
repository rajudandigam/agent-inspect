# RETRIEVER → LLM order from local OpenInference evidence

Illustrative Balaram-style retrieval/generation order checks over the existing
OpenInference reader boundary. **Not** a native Python AgentInspect adapter.

## Honesty

- `RETRIEVER` is a real persisted `InspectKind` and the OpenInference reader preserves it.
- Typed `steps.orderRelations` endpoints are only `TOOL | LLM` today — a
  `RETRIEVER → LLM` relation is **not** expressible there without an additive design.
- This recipe uses a **recipe-local** `TraceCheckRule` over preserved RETRIEVER/LLM
  events. It does **not** relabel RETRIEVER as TOOL.
- Ordering does not prove the LLM semantically consumed retrieved content.
- Fixtures are **illustrative** synthetic OpenInference documents (external Python
  LangGraph validation remains pending unless real exported fixtures are supplied).

## Run

```bash
pnpm --filter agent-inspect-recipe-retriever-llm-order-otlp start
```
