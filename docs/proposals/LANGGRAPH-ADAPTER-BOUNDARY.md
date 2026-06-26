# LangGraph adapter boundary decision

**Status:** v1.7.0 chunk 8 decision; v1.8 chunk 7 fixture-backed through `@agent-inspect/langchain`.
**Purpose:** decide whether LangGraph support belongs in `@agent-inspect/langchain` or a new package.
**Last verified:** 2026-06-26.

## Decision

LangGraph support should start inside the existing `@agent-inspect/langchain` adapter boundary, not a new package.

Rationale:

- LangGraph JS lives in the LangChain ecosystem and current docs route LangGraph JS users through the LangChain documentation site.
- AgentInspect already ships a callback-style `@agent-inspect/langchain` adapter with explicit callback installation, metadata-only defaults, streaming metadata, local persistence, and no vendor sink.
- LangGraph runs should be captured through the same LangChain callback mechanism when that callback surface is available.
- A separate `@agent-inspect/langgraph` package is not justified until deterministic fixtures prove LangGraph exposes important lifecycle data that cannot be represented through the existing LangChain callback events.

## Package boundary

Keep the boundary dependency-isolated:

- no LangGraph dependency in root/core;
- no LangGraph dependency in `agent-inspect`;
- no new optional package in v1.7 unless future fixtures prove the LangChain callback boundary cannot observe LangGraph runs safely;
- keep `@langchain/core` as the peer dependency for `@agent-inspect/langchain`;
- if LangGraph fixture tests are added, make `@langchain/langgraph` a dev-only fixture dependency or use structural local fixtures first.

## Capture policy

LangGraph support must preserve the existing LangChain adapter safety rules:

- metadata-only by default;
- no raw prompt/output/tool payload capture by default;
- no network upload behavior;
- explicit callback installation only;
- no monkey-patching;
- no default LangSmith or vendor sink configuration;
- local JSONL persistence only when the caller opts into `persist: true`.

## Fixture requirements

The v1.8 fixture set in `packages/langchain/test/langgraph-through-langchain.test.ts` verifies:

- structural callback attachment through `AgentInspectCallback`;
- root graph run naming and completion status;
- node/tool/LLM callback mapping through existing parent IDs;
- streaming metadata remains aggregate-only and stores no raw token text by default;
- persistence remains local and uses existing LangChain adapter behavior;
- missing/unknown parent IDs remain safe and warning-rich;
- no LangGraph, LangSmith, or hosted-service upload is required.

Fixtures use local structural callback payloads. Live provider calls, API keys, hosted LangSmith tracing, and network-dependent LangGraph platform behavior remain out of scope.

## Documentation stance

Public docs may say:

> LangGraph support is expected to ride through `@agent-inspect/langchain` callback integration first. Dedicated LangGraph package work is deferred until fixtures prove a callback-surface gap.

Do not advertise a separate LangGraph package or hosted LangGraph tracing product.
