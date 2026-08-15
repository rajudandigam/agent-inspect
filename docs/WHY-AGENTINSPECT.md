# Why AgentInspect

**Category:** Local-first evidence for TypeScript AI agents.

**Headline:** See what your agent did. Catch the wrong path in CI. Keep the evidence local.

**Outcome:** Capture once. Debug, prevent, and share from the same local trace.

## When to install

Install AgentInspect when you need to:

1. Capture a **framework-faithful** local execution tree (JSONL you own).
2. Assert **deterministic** trajectory expectations (TraceFacts / TraceContract) without an LLM judge.
3. Produce **portable Evidence v2** for a PR or incident handoff.
4. Let a **coding assistant** inspect the same local facts over read-only MCP.

## When not to install

- You need hosted multi-tenant APM or a maintainer-operated dashboard.
- You need LLM-as-judge eval hosting or a prompt registry as the primary product.
- You need compliance certification (SOC2/HIPAA) from the library itself.

AgentInspect complements platforms like LangSmith, Langfuse, and Phoenix; it owns the laptop → PR evidence loop.

## Three jobs

1. **Debug** — Read nested steps, tools, model metadata, and the first causal failure from local JSONL.
2. **Prevent** — Deterministic TraceFacts / TraceContract checks, suites, and CI gates.
3. **Share** — Share-checked Evidence v2 with integrity verification (not compliance certification).

Optional Preview: read-only MCP over the same local facts.

## Proof language (public-safe)

Validated against production-shaped NestJS/LangGraph integrations. Fixture-backed across official adapters and packed consumer workflows.

See [product/PUBLIC-PRODUCT-FACTS.md](./product/PUBLIC-PRODUCT-FACTS.md) and [DECISION-GUIDE.md](./DECISION-GUIDE.md).
