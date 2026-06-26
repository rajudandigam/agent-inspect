# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-1-ai-sdk-logical-event-identity"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-0-planning-reset"
```

## Goal

Fix AI SDK adapter lifecycle persistence so one logical run, step, and tool keeps one logical identity through raw persisted rows, canonical readers, tree construction, `what`, report, and diff-compatible output.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 1
- `docs/proposals/AI-SDK-INTEGRATION.md`
- directly related AI SDK adapter source, tests, fixtures, and inspection helpers only

## In scope

1. Inspect current `@agent-inspect/ai-sdk` lifecycle mapping for `generateText`, `streamText`, and tools.
2. Preserve stable logical identities for AI SDK run, step, and tool start/completion rows without duplicate starts, incomplete parents, or orphaned children after canonical conversion.
3. Ensure normalized traces build correct execution trees and remain compatible with `what`, report, and diff paths.
4. Add or update focused fixtures/tests for raw persisted rows, `readTrace`/`openTrace`, tree construction, `what`, report, diff-compatible output, `generateText`, `streamText`, and tool lifecycle.
5. Keep metadata-only defaults, no-network fixtures, and package isolation intact.

## Out of scope

- parallel/reused integration isolation beyond what is required for logical identity;
- provider failure, interrupted streaming, callback disorder, writer failure, flush, and close coverage reserved for chunk 2;
- preview/redaction option behavior reserved for chunk 3;
- check engine/API/CLI design;
- OpenAI Agents, LangGraph, Vitest, Jest, or safe-artifact implementation;
- package version changes, changesets, npm publication, schema changes, root/core dependencies, or network behavior.

## Acceptance criteria

- one AI SDK logical run/step/tool has one stable identity from raw v0.2 rows through canonical reader output;
- tree construction has no duplicate starts, incomplete parents, or avoidable orphaned children for covered AI SDK fixtures;
- `what`, report, and diff-compatible output consume the fixed normalized trace without adapter-specific parsing;
- focused tests cover `generateText`, `streamText`, and tool lifecycle paths;
- v0.1 writes and v0.1/v0.2 reads remain compatible.

## Focused tests

```bash
pnpm exec vitest run packages/ai-sdk/test packages/core/test/readers packages/core/test/report.test.ts packages/core/test/diff.test.ts
```

Adjust the exact file list after inspecting the directly relevant tests, but keep it focused on AI SDK lifecycle identity and canonical inspection paths.

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
fix: preserve ai sdk trace lifecycle identity
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, public breaking/schema/dependency/network decisions, or validation failures that cannot be fixed within chunk 1 scope.
