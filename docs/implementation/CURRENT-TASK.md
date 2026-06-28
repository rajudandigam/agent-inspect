# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-3-public-jest-reporter"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-2-public-vitest-reporter"
```

## Goal

Promote the Jest reporter/helper toward public adoption-ready behavior using the shared reporter artifact contract and the Vitest reporter precedent.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- `packages/core/src/reporters/index.ts`
- `packages/vitest/src/index.ts`
- `packages/jest/package.json`
- relevant existing Jest reporter source/tests

## Prior chunk evidence

- Vitest reporter now writes shared `0.1` artifact manifests through `agent-inspect/reporters`.
- Failed associated tests produce deterministic local report/summary artifact paths.
- Successful tests remain quiet by default, even when trace metadata is present.
- Reporter write failures remain diagnostics and do not throw through Vitest hooks.
- `@agent-inspect/vitest` remains private pending maintainer first-publication setup before v2.2 release.

## In Scope

1. Implement Jest reporter/helper lifecycle around the shared reporter contract.
2. Preserve Jest CJS-style consumer compatibility.
3. Preserve quiet success by default.
4. Generate useful local artifacts for failed tests only.
5. Preserve original Jest failures and exit behavior.
6. Add focused Jest reporter tests and compatibility coverage as needed.
7. Keep package publication/private-state decisions explicit.

## Out Of Scope

- Vitest behavior changes;
- hosted uploads;
- GitHub API comments/checks;
- changesets;
- tags;
- publishing;
- root/core framework dependencies;
- schema changes to persisted traces;
- first publication without maintainer confirmation.

## Acceptance Criteria

- Failed Jest tests produce deterministic local artifact metadata.
- Successful Jest tests remain quiet by default.
- Reporter failures become diagnostics and do not mask test failures.
- Jest remains absent from root/core dependencies.
- If `@agent-inspect/jest` is made public, the first-publication gate remains documented for the maintainer before v2.2 release.

## Suggested Commit

```text
feat(jest): publish trace test reporter
```

## Focused Tests

```bash
pnpm exec vitest run packages/jest/test
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

Stop on unrelated worktree changes, maintainer-only publication setup, reporter package publication decisions that require npm setup, root/core dependency requirements, schema changes, network behavior expansion, Vitest-specific regressions, or validation failures that cannot be repaired in this chunk.
