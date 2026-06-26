# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-3-ai-sdk-capture-and-redaction-contract"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-2-ai-sdk-isolation-and-failure-lifecycle"
```

## Goal

Implement the published AI SDK preview/redaction options safely or deprecate them with explicit diagnostics so there are no silent no-op capture controls.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 3
- `docs/proposals/AI-SDK-INTEGRATION.md`
- directly related AI SDK adapter source, tests, fixtures, redaction helpers, and option docs only

## In scope

1. Inspect the current AI SDK preview/redaction options and RFC language.
2. Implement bounded/redacted preview persistence only if it can be made safe within the existing adapter contract.
3. Otherwise, deprecate unsupported options with explicit diagnostics and documentation.
4. Preserve metadata-only defaults and ensure prompt/output capture remains opt-in, bounded, and redacted before persistence.
5. Keep accepted event order deterministic, fixture behavior no-network, and existing trace compatibility intact.

## Out of scope

- optional-package install smoke reserved for chunk 4;
- check engine/API/CLI design;
- OpenAI Agents, LangGraph, Vitest, Jest, or safe-artifact implementation;
- package version changes, changesets, npm publication, schema changes, root/core dependencies, or network behavior.

## Acceptance criteria

- no AI SDK capture or redaction option is silently ignored;
- metadata-only defaults still avoid raw prompt/output persistence;
- any preview capture is bounded and redacted before disk, or unsupported preview options produce explicit diagnostics;
- diagnostics do not throw into AI SDK callbacks or alter generation behavior;
- v0.1 writes and v0.1/v0.2 reads remain compatible.

## Focused tests

```bash
pnpm exec vitest run packages/ai-sdk/test/api-stability.test.ts packages/core/test/security-redaction.test.ts packages/core/test/redaction-profiles.test.ts
```

Adjust the exact file list after inspecting directly relevant tests, but keep it focused on AI SDK capture options, redaction, diagnostics, and metadata-only compatibility.

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
fix: enforce ai sdk capture and redaction options
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, public breaking/schema/dependency/network decisions, unsafe raw prompt/output persistence, or validation failures that cannot be fixed within chunk 3 scope.
