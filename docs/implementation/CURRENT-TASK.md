# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-planning-reset"
status: "ready"
dependsOn: "v1.6.0 published"
```

## Goal

Prepare the v1.7 execution plan and adapter documentation alignment before any adapter runtime implementation.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.7-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/proposals/AI-SDK-INTEGRATION.md`
- current official AI SDK telemetry integration docs
- current official OpenAI Agents JS tracing processor docs

## In scope

1. Verify current framework docs and align the v1.7 execution plan with them.
2. Keep adapter work optional-package only.
3. Preserve metadata-only privacy defaults:
   - AI SDK examples and implementation must set or document `recordInputs: false` and `recordOutputs: false`.
   - OpenAI Agents JS planning must avoid default backend export surprises and document local-only processor behavior before implementation.
4. Keep the next implementation chunk focused on AI SDK v6 telemetry/RFC verification.

## Out of scope

- adapter runtime code
- package scaffolds
- new dependencies
- package version changes
- changesets
- publish/tag/release work
- network upload behavior
- root/core dependencies on AI SDK, OpenAI Agents, LangGraph, OpenTelemetry, or LangChain

## Acceptance criteria

- Public roadmap names v1.6.0 as the current published release and v1.7.0 as Now.
- Maintainer roadmap and release-train state point at v1.7.0.
- `V1.7.0-EXECUTION-PLAN.md` exists with chunked implementation order.
- Validation passes: `pnpm typecheck`, `pnpm test`, `git diff --check`.

## Stop condition

Stop before implementing AI SDK, OpenAI Agents JS, LangGraph, package scaffolds, dependencies, or schema/API changes.
