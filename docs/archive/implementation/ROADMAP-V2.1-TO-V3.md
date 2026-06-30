# AgentInspect Roadmap — v2.1 to v3

## Current direction

AgentInspect is the local-first toolkit for TypeScript AI agents:

> trace what happened, check what should have happened, and redact what should never leave your machine.

AgentInspect should become the default local TypeScript utility for:

- agent trace inspection;
- deterministic agent checks and evals;
- safe trace sharing;
- framework-native local debugging;
- standards-compatible local trace workflows.

It is not a hosted observability platform, SaaS dashboard, replay engine, prompt registry, dataset manager, provider cost platform, or LLM-as-judge platform.

## v2.0 baseline

v2.0 established:

- small stable root API;
- schema 1.0 persisted writer path;
- v0.1, v0.2, and v1.0 reader compatibility;
- explicit non-destructive trace migration;
- stable local-first product language;
- advanced APIs behind subpaths.

## v2.1 — Utility triangle: eval and redact

Goal:

```text
trace + eval + redact
```

Primary outcomes:

- public `@agent-inspect/eval`;
- public `@agent-inspect/redact`;
- deterministic eval CLI;
- reusable redaction CLI/API;
- shared redaction engine across trace writing, export, verify-safe, explain, and artifacts;
- adoption docs and deterministic recipes for local evals, share-safe redaction copies, and eval-before-artifacts CI workflows.

Non-goals:

- no LLM judge by default;
- no cloud model call;
- no compliance claims;
- no provider pricing;
- no dataset platform.

## v2.2 — Test runners and CI workflow

Goal: make AgentInspect part of daily tests.

Primary outcomes:

- public `@agent-inspect/vitest`;
- public `@agent-inspect/jest`;
- failed test trace artifacts;
- optional eval/check results in artifacts;
- GitHub Step Summary support;
- quiet success mode.

## v2.3 — Framework adapter hardening

Goal: make framework adoption genuinely low-friction.

Focus:

- make `@agent-inspect/ai-sdk` the strongest adapter;
- strengthen `@agent-inspect/openai-agents`;
- improve LangGraph through `@agent-inspect/langchain`;
- add Mastra or NestJS only if demand is proven.

## v2.4 — Sessions, multi-agent, MCP, workflow causality

Goal: support real multi-run agent systems.

Focus:

- session navigation;
- handoffs;
- retries;
- attempts;
- sub-agents;
- MCP tool tracing;
- search/session filters;
- no gateway product.

## v2.5 — Guardrails and circuit breakers

Goal: small optional utilities for repeated local agent safety problems.

Focus:

- `@agent-inspect/guardrails`;
- `@agent-inspect/circuit`;
- deterministic guards;
- trace-emitting guardrail results;
- no remote policy engine.

## v2.6 — Optional viewer and IDE/MCP surfaces

Goal: add optional surfaces only after utility adoption.

Focus:

- `agent-inspect serve` localhost-only read-only viewer;
- read-only MCP server;
- possible IDE surfaces if users ask.

## v3.0 — Extensible local agent trace toolchain

v3 is conditional.

Proceed only when:

- v2 has retained users;
- reporter/check workflows recur;
- external projects emit compatible traces;
- at least one third-party adapter exists;
- users ask for extensibility.

Stable extension contracts may include:

- TraceSource;
- TraceReader;
- TraceWriter;
- TraceTransform;
- TraceCheck;
- TraceRenderer;
- TraceIndexer;
- TraceAdapter;
- conformance runner;
- third-party adapter registry.

Still not v3 goals:

- hosted SaaS;
- billing;
- prompt registry;
- dataset platform;
- production alerting;
- automatic production replay;
- automatic remediation.
