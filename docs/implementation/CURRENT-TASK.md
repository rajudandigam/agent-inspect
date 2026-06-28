# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-3-langchain-langgraph-hardening"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-2-openai-agents-adapter-hardening"
```

## Goal

Improve LangGraph-through-LangChain coverage without adding a new package unless the existing adapter cannot express the needed metadata safely.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTERS.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `packages/langchain/src/`
- `packages/langchain/test/`
- `examples/recipes/langgraph-callback-local/`

## Current Evidence

- v2.3 chunk 1 hardened AI SDK coverage for isolated parallel integrations and route-style local telemetry.
- v2.3 chunk 2 hardened OpenAI Agents local-only replacement guidance, metadata-only fixtures, and no-upload recipe coverage.
- LangChain remains the existing path for LangGraph callback telemetry; the v2.3 plan defers any new `@agent-inspect/langgraph` package unless demand and extension-point evidence justify it.
- The current goal is better trace usefulness for graph-shaped LangChain/LangGraph callback flows while preserving optional dependency boundaries.

## In Scope

1. Improve LangGraph-through-LangChain fixture coverage for graph node identity, stream-ish callback flow, parallel branches, and session/thread metadata where the existing callback surface supports it.
2. Clarify limitations in docs without introducing a separate package.
3. Preserve no-network, no-root-dependency behavior.
4. Keep changes inside the LangChain adapter, fixtures, recipes, and docs/state.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- new `@agent-inspect/langgraph` package without an explicit demand gate;
- LangGraph, OpenTelemetry, or provider dependencies in root/core;
- hosted upload, vendor exporter, or provider call behavior;
- raw prompt/output/tool payload capture by default;
- schema changes;
- AI SDK/OpenAI Agents/Mastra/Nest runtime changes.

## Acceptance Criteria

- LangGraph-through-LangChain fixtures produce useful local trace identity and metadata for graph-shaped flows.
- Docs explain the current LangChain callback path and limitations without promising unsupported LangGraph-native behavior.
- No root/core dependency or package export drift is introduced.
- Existing LangChain imports remain compatible.
- Validation passes.

## Suggested Commit

```text
feat(langchain): improve LangGraph trace mapping
```

## Focused Tests

```bash
pnpm exec vitest run packages/langchain/test/agent-inspect-callback.test.ts packages/langchain/test/langgraph-through-langchain.test.ts packages/core/test/adapter-executable-conformance.test.ts
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm pack:smoke
git diff --check
```

## Stop Condition

Stop if LangGraph usefulness requires a new public API, schema change, new package, root/core dependency, default network/upload behavior, raw payload capture by default, package-version/change-set work, or validation failure outside the LangChain/LangGraph hardening scope.
