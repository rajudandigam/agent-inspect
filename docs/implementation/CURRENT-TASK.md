# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-ai-sdk-tool-error-streaming"
status: "ready"
dependsOn: "v1.7-ai-sdk-metadata-integration"
```

## Goal

Harden the `@agent-inspect/ai-sdk` adapter against AI SDK tool calls, errors, and streaming metadata using deterministic no-network fixtures.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- `packages/ai-sdk/src/index.ts`
- directly related tests only

## In scope

1. Map tool call start/finish/error metadata without raw tool inputs or outputs.
2. Preserve AI SDK/app behavior on adapter or writer failures.
3. Add deterministic fixtures for tool calls, tool failures, provider failures where in-scope, and streaming timing/count metadata when exposed safely.
4. Preserve metadata-only defaults and `recordInputs: false` / `recordOutputs: false` guidance.

## Out of scope

- live provider calls or network tests
- recipes/docs beyond test/API notes
- publishing the new package
- package version changes
- changesets
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Tests cover tool start/finish/error and writer failure isolation.
- No raw prompt, message, generated text, tool input/output, headers, or request/response body is persisted by default.
- Focused validation and the required chunk gate pass.

## Stop condition

Stop if implementation requires network behavior, a root/core dependency, public schema change, or default raw prompt/output/tool payload capture.
