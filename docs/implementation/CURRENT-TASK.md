# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-ai-sdk-package-scaffold"
status: "ready"
dependsOn: "v1.7-ai-sdk-telemetry-rfc"
```

## Goal

Scaffold the optional `@agent-inspect/ai-sdk` package boundary after the verified AI SDK v6 telemetry RFC, without implementing runtime lifecycle mapping yet.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- root/package workspace manifests and existing optional package patterns only

## In scope

1. Add the `@agent-inspect/ai-sdk` optional workspace package scaffold.
2. Add package manifest, export/type entry, build config, and minimal API placeholder consistent with the verified RFC.
3. Use AI SDK as a peer dependency only for the optional package.
4. Review Changesets package linking/ignore behavior and package smoke wiring as needed.
5. Keep root/core free of AI SDK, OpenTelemetry, OpenAI Agents, LangGraph, and LangChain dependencies.

## Out of scope

- lifecycle mapping implementation
- runtime tracing behavior
- provider calls or network tests
- package version changes
- changesets
- publish/tag/release work
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Optional package scaffold builds/types without runtime mapping.
- Root/core package manifests do not gain adapter/framework dependencies.
- Package boundary documents metadata-only/no-upload defaults.
- Focused validation from the execution plan passes.

## Stop condition

Stop if scaffolding requires a root/core dependency, public schema change, network behavior, or implementation of adapter lifecycle mapping.
