# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-langgraph-adapter-boundary"
status: "ready"
dependsOn: "v1.7-openai-agents-adapter-scaffold"
```

## Goal

Decide whether LangGraph support belongs in the existing `@agent-inspect/langchain` adapter boundary or requires a separate optional package.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- directly related LangChain adapter docs/source/tests
- current official LangGraph/LangChain callback docs only if needed

## In scope

1. Inspect the current `@agent-inspect/langchain` callback surface and docs.
2. Decide whether LangGraph can be supported through existing LangChain callbacks without a new package.
3. Document fixture and compatibility requirements for future LangGraph coverage.
4. Preserve optional dependency isolation and avoid root/core dependencies.

## Out of scope

- LangGraph runtime code or fixtures beyond a docs decision
- new package scaffold unless the decision proves it is required
- package version changes
- changesets
- publishing
- root/core dependencies on LangGraph, LangChain, OpenTelemetry, AI SDK, or OpenAI Agents

## Acceptance criteria

- The decision is documented in the relevant adapter/API/proposal or implementation docs.
- Future fixture requirements are explicit and no-network/local-only.
- Focused docs validation and required chunk gate pass.

## Stop condition

Stop if the decision requires a new dependency in root/core, a public schema change, network behavior, or runtime implementation beyond the boundary decision.
