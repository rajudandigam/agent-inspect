# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-5-adapter-promotion"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-4-explain-provider-design-gate"
```

## Goal

Promote AI SDK, OpenAI Agents, and LangChain/LangGraph adoption paths with local-only docs and recipe coverage.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Promote AI SDK, OpenAI Agents, and LangChain/LangGraph adoption paths in README/docs.
2. Add or register no-network adapter recipes/fixtures where missing.
3. Clarify OpenAI Agents local-only replacement vs additional processor behavior.
4. Keep optional integration dependencies package-scoped.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- provider/network implementation;
- schema changes;
- new root/core dependencies;
- new root/core adapter dependencies;
- live provider calls, hosted tracing, or upload behavior.

## Focused validation

```bash
pnpm recipes:check
pnpm fixtures:check
pnpm exec vitest run packages/ai-sdk/test/api-stability.test.ts packages/openai-agents/test/api-stability.test.ts packages/langchain/test/langgraph-through-langchain.test.ts
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- README/docs promote adapter adoption paths and local-only privacy defaults.
- AI SDK and OpenAI Agents no-network recipes remain discoverable.
- LangGraph-through-LangChain has a no-network local recipe.
- OpenAI Agents replacement vs additional processor behavior is explicit.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.

## Completion evidence

- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 traces, 6 v0.2 traces, 8 logs, and 5 configs validated.
- Focused adapter tests passed:
  `CI=true pnpm exec vitest run packages/ai-sdk/test/api-stability.test.ts packages/openai-agents/test/api-stability.test.ts packages/langchain/test/langgraph-through-langchain.test.ts`
  - 3 files passed, 23 tests passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1086 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
docs: promote adapter adoption paths
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
