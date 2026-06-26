# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-7-langgraph-through-langchain"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-6-openai-agents-safety-and-recipes"
```

## Goal

Add deterministic no-network LangGraph-through-LangChain fixtures and mapping assertions for graph/node identity, subgraphs, tasks, branches, checkpoints, retries, handoffs, thread/session IDs, streaming metadata, and unknown parents where exposed by official callbacks.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 7
- relevant LangChain/LangGraph RFC or proposal docs if present
- `packages/langchain/src/agent-inspect-callback.ts`
- `packages/langchain/test/*`
- existing LangChain example/fixture coverage

## In scope

1. Add no-network LangGraph-shaped fixtures that exercise the existing LangChain callback integration, not real provider/model execution.
2. Preserve explicit trace/span/run identity, parentage, ordering, unknown-parent warnings, and confidence policy.
3. Cover graph/node/subgraph/task/branch/checkpoint/retry/handoff/thread/session metadata where available from callback shapes.
4. Add reader/tree/report round-trip assertions only where directly needed for the new fixture semantics.
5. Keep LangGraph support dependency-isolated through the existing LangChain adapter boundary; do not add root/core runtime dependencies.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or changing package publish status;
- real LangGraph provider/model execution, network calls, API keys, hosted tracing/export, or replay behavior;
- new root exports unless the active plan explicitly requires them;
- broad adapter conformance utilities, checks engine work, or reporter packages.

## Acceptance criteria

- fixtures are deterministic, local-only, and require no network, provider credentials, LangSmith upload, or external services;
- graph/node/task metadata is preserved as bounded safe metadata without raw prompt/output capture;
- unknown or missing parents are represented conservatively with warnings/confidence rather than fabricated relationships;
- existing LangChain callback behavior and public imports remain compatible;
- docs do not imply a new LangGraph package or hosted tracing product.

## Focused tests

```bash
pnpm exec vitest run packages/langchain/test/agent-inspect-callback.test.ts packages/langchain/test/agent-inspect-callback-streaming.test.ts packages/langchain/test/agent-inspect-callback-persistence.test.ts packages/langchain/test/metadata.test.ts
```

Adjust the exact file list after inspecting current LangChain fixture coverage, but keep the chunk focused on deterministic LangGraph-through-LangChain behavior.

## Chunk gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Proposed commit

```text
feat: add langgraph trace mapping fixtures
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any fixture requiring network/provider credentials/default hosted export, root/core dependency expansion, package publication semantics, raw content capture requirements, or validation failures that cannot be fixed within chunk 7 scope.
