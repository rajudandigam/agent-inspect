# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-0-post-v2.2-reconciliation-and-adapter-scorecard"
status: "active"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-version-packages-pr-and-publication"
```

## Goal

Start the v2.3 adapter hardening train by reconciling v2.2 publication evidence and documenting adapter priorities before runtime adapter work.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/ADAPTERS.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `docs/product/ADOPTION-METRICS.md`

## Current Evidence

- v2.2 Version Packages PR #44 was merged to `main` at `6be4e92a492c9df20b73a1fe9a75503f456960bc`.
- GitHub Actions CI run `28311954628` passed for the v2.2 merge commit.
- GitHub Actions Publish run `28311954633` passed and published the linked v2.2 public package set.
- npm `latest` resolves to `2.2.0` for `agent-inspect`, `@agent-inspect/ai-sdk`, `@agent-inspect/langchain`, `@agent-inspect/openai-agents`, `@agent-inspect/tui`, `@agent-inspect/redact`, `@agent-inspect/eval`, `@agent-inspect/vitest`, and `@agent-inspect/jest`.
- Git tags and GitHub releases exist for the nine v2.2.0 public package releases.

## In Scope

1. Record v2.2 publication evidence in state/readiness docs.
2. Inventory official adapter package status and conformance gaps.
3. Document adapter priority order for v2.3 hardening.
4. Record Mastra/Nest demand-gate inputs and explicit go/no-go posture.
5. Keep chunk 0 docs/planning-only unless the active plan requires a narrowly scoped source/test inspection.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- new adapter runtime implementation;
- Mastra/Nest packages or hidden monkey-patching;
- root/core framework or provider dependencies;
- schema changes;
- default network behavior.

## Acceptance Criteria

- v2.2 publication evidence is recorded and non-conflicting.
- Adapter priorities and known conformance gaps are documented.
- Mastra/Nest posture is explicit and demand-gated.
- No runtime code, dependency, schema, package version, tag, or publish changes are made in chunk 0.
- Validation passes.

## Suggested Commit

```text
docs: start v2.3 adapter hardening train
```

## Focused Tests

```bash
pnpm typecheck
pnpm test
```

## Chunk Gate

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Stop Condition

Stop if v2.2 publication evidence conflicts, registry/tag/release state regresses, adapter priorities require a maintainer product decision, Mastra/Nest demand evidence is ambiguous, validation fails outside this docs/planning scope, or unrelated worktree changes appear.
