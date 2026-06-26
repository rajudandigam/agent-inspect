# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-2-ai-sdk-isolation-and-failure-lifecycle"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-1-ai-sdk-logical-event-identity"
```

## Goal

Make AI SDK adapter lifecycle state safe for overlapping or reused integrations, and cover the failure lifecycle cases that must not alter application behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 2
- `docs/proposals/AI-SDK-INTEGRATION.md`
- directly related AI SDK adapter source, tests, fixtures, and writer lifecycle helpers only

## In scope

1. Decide whether reused/overlapping AI SDK integrations are safely supported or explicitly rejected with diagnostics.
2. Prevent overlapping AI SDK calls from sharing mutable run, step, or tool state.
3. Cover provider failure, interrupted streaming, missing/out-of-order callbacks, unsafe values, writer failure, flush, and close.
4. Ensure adapter diagnostics expose failures without throwing into AI SDK callbacks or changing generation behavior.
5. Keep accepted event order deterministic, metadata-only defaults intact, and fixtures no-network.

## Out of scope

- preview/redaction option behavior reserved for chunk 3;
- optional-package install smoke reserved for chunk 4;
- check engine/API/CLI design;
- OpenAI Agents, LangGraph, Vitest, Jest, or safe-artifact implementation;
- package version changes, changesets, npm publication, schema changes, root/core dependencies, or network behavior.

## Acceptance criteria

- overlapping calls cannot corrupt each other's lifecycle rows or parentage;
- provider failures and interrupted streams produce deterministic error lifecycle rows where the AI SDK exposes callbacks;
- missing or out-of-order callbacks are handled conservatively with diagnostics instead of fabricated relationships;
- unsafe callback values and writer/flush/close failures are isolated and surfaced through diagnostics/stats;
- application return values and errors are preserved;
- v0.1 writes and v0.1/v0.2 reads remain compatible.

## Focused tests

```bash
pnpm exec vitest run packages/ai-sdk/test/api-stability.test.ts packages/core/test/writers/index.test.ts
```

Adjust the exact file list after inspecting directly relevant tests, but keep it focused on AI SDK lifecycle isolation, failure behavior, and writer lifecycle safety.

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
fix: isolate ai sdk integration lifecycle state
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, public breaking/schema/dependency/network decisions, or validation failures that cannot be fixed within chunk 2 scope.
