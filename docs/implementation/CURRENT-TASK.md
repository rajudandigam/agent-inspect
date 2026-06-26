# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-8-executable-adapter-conformance"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-7-langgraph-through-langchain"
```

## Goal

Create shared executable adapter conformance utilities and fixture assertions for success, failure, tools, multiple tools, LLM, streaming, token usage, parentage, parallelism, correlation, redaction, truncation, no-network behavior, and canonical-reader round trips.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 8
- `docs/ADAPTER-CONFORMANCE.md`
- `docs/implementation/adapter-conformance-matrix.json`
- existing adapter tests under `packages/ai-sdk/test`, `packages/openai-agents/test`, and `packages/langchain/test`
- persisted reader/tree helpers used by current adapter tests

## In scope

1. Add shared test utilities or fixtures that make adapter conformance executable without changing runtime public APIs.
2. Assert success/failure, tools, multiple tools, LLM/token usage, streaming metadata, parentage, parallelism, correlation, redaction/truncation, no-network behavior, and canonical-reader round trips where current adapters expose those signals.
3. Reuse existing adapter fixtures and callback/processor test shapes rather than adding provider execution.
4. Update conformance docs/matrix only to reflect executable coverage that lands in this chunk.
5. Keep root/core dependency boundaries unchanged.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- real provider/model execution, API keys, network calls, hosted telemetry/export, or replay behavior;
- new framework adapter packages or new root exports unless the active plan explicitly requires them;
- checks engine, reporter packages, or broad CLI feature work.

## Acceptance criteria

- conformance tests are deterministic, local-only, and require no network, provider credentials, or hosted tracing service;
- shared assertions cover adapter event identity, parentage, token usage, streaming summaries, redaction/truncation, and reader round trips without duplicating parsing logic;
- tests fail clearly with adapter/package/signal context;
- no adapter persists raw prompts, messages, generated text, tool payloads, stream tokens, request/response bodies, headers, or hosted trace payloads by default;
- optional package and root/core dependency boundaries remain unchanged.

## Focused tests

```bash
pnpm exec vitest run packages/core/test/adapter-conformance-matrix.test.ts packages/ai-sdk/test/api-stability.test.ts packages/openai-agents/test/api-stability.test.ts packages/langchain/test/langgraph-through-langchain.test.ts packages/langchain/test/agent-inspect-callback-streaming.test.ts
```

Adjust the exact file list after inspecting existing adapter fixtures, but keep the chunk focused on executable adapter conformance.

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
test: enforce adapter conformance fixtures
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any fixture requiring network/provider credentials/default hosted export, root/core dependency expansion, package publication semantics, raw content capture requirements, or validation failures that cannot be fixed within chunk 8 scope.
