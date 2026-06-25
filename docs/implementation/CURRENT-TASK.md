# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-ai-sdk-metadata-integration"
status: "ready"
dependsOn: "v1.7-ai-sdk-package-scaffold"
```

## Goal

Implement the first metadata-only `@agent-inspect/ai-sdk` integration for AI SDK `generateText` and `streamText` lifecycle events.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- `packages/ai-sdk/src/index.ts`
- directly related tests only

## In scope

1. Implement the adapter factory/runtime bridge for metadata-only AI SDK telemetry events.
2. Map `generateText` and `streamText` lifecycle start/finish events into local AgentInspect persisted events.
3. Preserve application behavior when integration, writer, clone, serialization, flush, or close logic fails.
4. Keep examples/tests explicit that host AI SDK calls must set `recordInputs: false` and `recordOutputs: false`.
5. Keep the package private until v1.7 release readiness to avoid the push-to-main publish workflow releasing it early.

## Out of scope

- full tool/error/streaming hardening beyond the first metadata-only path
- live provider calls or network tests
- publishing the new package
- package version changes
- changesets
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Metadata-only integration tests cover generateText and streamText with local fake models or AI SDK test utilities.
- No raw prompt, message, generated text, tool input/output, headers, or request/response body is persisted by default.
- Root/core package manifests do not gain adapter/framework dependencies.
- Focused validation and the required chunk gate pass.

## Stop condition

Stop if implementation requires network behavior, a root/core dependency, public schema change, or default raw prompt/output capture.
