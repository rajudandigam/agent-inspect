# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-ai-sdk-recipes-docs"
status: "ready"
dependsOn: "v1.7-ai-sdk-tool-error-streaming"
```

## Goal

Make `@agent-inspect/ai-sdk` adoption reproducible with local, no-network recipes, package smoke coverage, and public adapter docs.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- `packages/ai-sdk/src/index.ts`
- `packages/ai-sdk/test/api-stability.test.ts`
- directly related docs, recipe, and smoke tests only

## In scope

1. Add a local no-network AI SDK recipe or recipe fixture.
2. Update `docs/ADAPTERS.md`, `docs/API.md`, README, and roadmap references as needed.
3. Add package smoke or install coverage for the optional package without publishing it.
4. Document explicit privacy defaults: metadata-only, no upload, `recordInputs: false`, and `recordOutputs: false`.

## Out of scope

- live provider calls or network tests
- adapter runtime behavior beyond documentation/smoke gaps
- OpenAI Agents JS, LangGraph, or conformance matrix work
- package version changes
- changesets
- publishing the new package
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- AI SDK docs and recipe show no-network, local-first usage.
- Package smoke coverage includes `@agent-inspect/ai-sdk` where appropriate.
- Privacy guidance explicitly prevents raw prompt/output/tool payload capture by default.
- Focused validation and the required chunk gate pass.

## Stop condition

Stop if docs or smoke coverage requires making `@agent-inspect/ai-sdk` publishable before release readiness, adding root/core dependencies, or enabling network upload behavior.
