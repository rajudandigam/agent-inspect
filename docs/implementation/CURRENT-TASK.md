# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-5-demand-gated-mastra-nest-decision"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-4-adapter-conformance-runner-upgrade"
```

## Goal

Record defensible Mastra and NestJS adapter decisions without adding shallow packages or broad monkey-patching.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTERS.md`
- `docs/product/ADOPTION-METRICS.md`
- `examples/recipes/`

## Current Evidence

- v2.3 chunks 1-4 hardened the official AI SDK, OpenAI Agents, LangChain/LangGraph, and shared conformance paths.
- The v2.3 plan explicitly defers Mastra/Nest packages unless demand and extension-point evidence justify narrow helpers.
- Product boundary disallows universal monkey-patching, hidden telemetry, root framework dependencies, hosted upload, and shallow adapters.

## In Scope

1. Review existing demand/adoption evidence for Mastra and NestJS.
2. Record whether each path ships a package, recipe/helper, or explicit deferral.
3. Add or update a recipe only if it stays dependency-light, local-only, and does not imply broad framework instrumentation.
4. Update adapter docs/product evidence/state.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- new packages without demand evidence;
- Mastra/Nest dependencies in root/core;
- hidden monkey-patching or automatic instrumentation;
- hosted upload, provider calls, or network behavior;
- schema changes;
- AI SDK/OpenAI Agents/LangChain runtime changes.

## Acceptance Criteria

- Mastra and NestJS decisions are explicit and defensible.
- No shallow adapter package is added.
- Docs explain any recipe/helper path and its limitations.
- Validation passes.

## Suggested Commit

```text
docs: record demand-gated adapter decisions
```

## Focused Tests

```bash
pnpm recipes:check
pnpm typecheck
```

## Chunk Gate

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Stop Condition

Stop if a decision requires a new public package, schema change, root/core dependency, framework monkey-patching, network behavior, package-version/change-set work, or maintainer judgment about demand evidence.
