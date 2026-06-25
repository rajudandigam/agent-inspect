# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-adapter-conformance-fixture-matrix"
status: "ready"
dependsOn: "v1.7-langgraph-adapter-boundary"
```

## Goal

Create shared conformance expectations for optional framework adapters without broadening runtime scope.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- `docs/proposals/OPENAI-AGENTS-JS-TRACING.md`
- `docs/proposals/LANGGRAPH-ADAPTER-BOUNDARY.md`
- directly related adapter tests/docs only

## In scope

1. Add a no-network adapter conformance fixture matrix covering run, step, tool, LLM, error, streaming, and metadata bounds expectations.
2. Add shared conformance docs/tests where useful.
3. Keep framework-specific fixtures dependency-isolated.
4. Preserve metadata-only and no-upload defaults.

## Out of scope

- new runtime mapping for any adapter
- live provider calls, network calls, hosted sinks, or upload behavior
- package version changes
- changesets
- publishing
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Matrix covers AI SDK, OpenAI Agents scaffold/future processor, LangChain, and LangGraph-through-LangChain expectations.
- Tests or docs enforce package-local/no-network/privacy expectations where practical.
- Focused validation and required chunk gate pass.

## Stop condition

Stop if conformance requires new runtime behavior, public schema change, network behavior, or root/core dependency expansion.
