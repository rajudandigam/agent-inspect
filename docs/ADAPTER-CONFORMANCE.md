# Adapter conformance

AgentInspect optional framework adapters must stay local-first, dependency-isolated, and metadata-only by default.

The machine-readable matrix lives at [docs/implementation/adapter-conformance-matrix.json](./implementation/adapter-conformance-matrix.json). The release-evidence fixture manifest lives at [docs/implementation/adapter-conformance-fixtures.json](./implementation/adapter-conformance-fixtures.json). These files track expected coverage for:

- run lifecycle
- generic steps
- tools
- LLM calls
- errors
- streaming metadata
- metadata bounds and privacy controls

The v1.7 matrix began as declarative coverage guidance. v1.8 made the core conformance path executable and requires canonical-reader round trips before adapter output is used by checks. v2.3 uses that foundation to harden official adapters without adding shallow new adapter packages.

Executable shared assertions live in `packages/core/test/adapter-executable-conformance.test.ts` and `packages/core/test/adapter-conformance-utils.ts`. Adapter-specific suites may add deeper fixture coverage, but the shared suite owns the cross-adapter defaults: local-only execution, no raw payload persistence, lifecycle identity, parentage, streaming summaries, token usage where exposed, and reader round trips.

Release evidence gate:

```bash
pnpm exec vitest run packages/core/test/adapter-executable-conformance.test.ts packages/core/test/adapter-conformance-matrix.test.ts
```

This is an internal official-adapter gate, not a third-party certification program.

## Current matrix

| Adapter | Package | Status | Default install mode | Boundary |
| --- | --- | --- | --- | --- |
| AI SDK | `@agent-inspect/ai-sdk` | implemented experimental; v2.3 priority 1 | AI SDK telemetry integration | optional package peer dependency |
| OpenAI Agents JS | `@agent-inspect/openai-agents` | implemented experimental; v2.3 priority 2 | `setTraceProcessors()` replacement | optional package peer dependency |
| LangChain | `@agent-inspect/langchain` | implemented experimental; v2.3 priority 3 | explicit callback | optional package peer dependency |
| LangGraph | `@agent-inspect/langchain` | fixture-backed through LangChain callback | explicit LangChain callback | existing LangChain adapter first |

## v2.3 scorecard

| Adapter path | Current coverage | Hardening gap | Decision |
| ------------ | ---------------- | ------------- | -------- |
| AI SDK | Shared conformance marks run, step, tool, LLM, error, streaming, and metadata bounds covered. | More adoption-grade fixtures for `generateText`, `streamText`, tool calls, Next.js route usage, parallel calls, abort/error lifecycle, and token metadata. | Harden first. |
| OpenAI Agents JS | Shared conformance covers run, step, tool, LLM, error, metadata bounds, and local-only replacement metadata; adapter fixtures cover agents, generations, tools, handoffs, guardrails, response, MCP tools, custom, transcription, and speech shapes without provider calls. | Streaming remains planned in the matrix; `addTraceProcessor()` remains documented only as an advanced user-owned additional mode. | Hardened second. |
| LangChain/LangGraph | LangChain and LangGraph-through-LangChain fixtures cover shared signals plus graph/node identity, subgraphs, checkpoint/session IDs, stream modes, handoffs, and parallel branch hints through callback metadata. | Callback-surface limits remain documented; no separate package is justified yet. | Hardened third. |
| Mastra | No official package, no conformance fixture, no root dependency. | Demand and extension-point evidence are not yet sufficient for local-only useful traces. | Defer. |
| NestJS | Structured-log recipe exists; no official framework adapter or conformance fixture. | Current evidence supports log ingestion. Demand may justify a narrow harness/bootstrap helper, not a broad monkey-patching adapter. | Defer package; keep recipe/helper gate. |

`@agent-inspect/vitest` and `@agent-inspect/jest` are public reporter packages, not framework trace adapters. Their artifact-manifest behavior is covered by reporter tests and CI-summary tests rather than this adapter conformance matrix.

## Required defaults

- No network behavior.
- No default upload behavior.
- No root/core dependency on framework SDKs.
- Metadata-only capture by default.
- Raw prompts, messages, outputs, tool payloads, headers, request bodies, and response bodies must not be persisted by default.
- Framework-specific fixtures must be no-network and dependency-isolated.

## Before claiming support

An adapter can be documented as supported only after no-network fixtures cover run, step, tool, LLM, error, streaming, and metadata-bound expectations for that framework path.
