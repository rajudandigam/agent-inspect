# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-1-shared-reporter-contract-and-artifact-manifest"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-0-post-v2.1-reconciliation-and-reporter-scope-freeze"
```

## Goal

Define the shared reporter artifact contract and manifest helpers used by future Vitest/Jest reporter chunks.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- relevant existing artifact/report/redaction helpers and tests

## Prior chunk evidence

- v2.1 publication verified for all seven public packages at `2.1.0`.
- v2.2 execution plan baseline set to `2.1.0`.
- v2.2 execution mode aligned to `autonomous-release-train`.
- Added `docs/proposals/CI-REPORTERS.md`.
- Reporter package scope frozen:
  - `@agent-inspect/vitest` and `@agent-inspect/jest` are currently private workspace packages.
  - v2.2 may promote them to public optional packages only after package smoke/compat coverage.
  - first-publication setup is a maintainer gate before v2.2 release if either package becomes public.

## In Scope

1. Add shared reporter contract types/helpers.
2. Add deterministic artifact manifest creation.
3. Add safe artifact path/layout helpers.
4. Add focused unit tests for manifest ordering, safe paths, and failure diagnostics.
5. Update docs/proposal details if implementation names are refined.

## Out Of Scope

- Vitest reporter lifecycle implementation;
- Jest reporter lifecycle implementation;
- package privacy/publication changes;
- changesets;
- tags;
- publishing;
- GitHub API comments;
- hosted uploads;
- new root/core runtime dependencies;
- schema changes to persisted traces.

## Acceptance Criteria

- Manifest output is deterministic.
- Artifact paths are safe and relative to an explicit output directory.
- Reporter helper failures are diagnostic-rich and do not mask test/application failures.
- No framework dependency enters root/core.
- Existing package exports and trace schema compatibility remain intact.

## Suggested Commit

```text
feat: add trace reporter artifact contract
```

## Focused Tests

```bash
pnpm exec vitest run packages/core/test/reporters
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm pack:smoke
git diff --check
```

Add `pnpm compat:smoke` if exports/package boundaries change.

## Stop Condition

Stop on unrelated worktree changes, reporter package publication decisions, root/core dependency requirements, schema changes, network behavior expansion, framework lifecycle decisions that belong to Vitest/Jest chunks, or validation failures that cannot be repaired in this chunk.
