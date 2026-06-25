# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-openai-agents-adapter-scaffold"
status: "ready"
dependsOn: "v1.7-openai-agents-tracing-rfc"
```

## Goal

Scaffold the optional `@agent-inspect/openai-agents` adapter only under the local-only boundary defined by `OPENAI-AGENTS-JS-TRACING.md`.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/OPENAI-AGENTS-JS-TRACING.md`
- directly related package scaffold/build/test files only

## In scope

1. Add an optional private workspace package scaffold for `@agent-inspect/openai-agents` if it remains dependency-isolated.
2. Expose only experimental no-upload/local-only placeholder APIs needed for package smoke.
3. Add build/test/tsup/vitest/package-smoke wiring for the scaffold.
4. Document that runtime mapping is not implemented until a later chunk and examples must use `setTraceProcessors()` replacement.

## Out of scope

- runtime span/trace mapping
- OpenAI network calls, provider calls, or default backend export
- `addTraceProcessor()` examples as a default path
- root/core dependency on OpenAI Agents, OpenTelemetry, AI SDK, LangGraph, or LangChain
- package version changes
- changesets
- publishing

## Acceptance criteria

- The scaffold builds and typechecks.
- Package smoke verifies the package remains private and dependency-isolated.
- No default upload behavior or processor auto-install occurs on import.
- Focused validation and required chunk gate pass.

## Stop condition

Stop if the scaffold requires root/core dependencies, runtime network behavior, default backend export, or an implementation beyond safe package boundaries.
