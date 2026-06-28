# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-2-public-vitest-reporter"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-1-shared-reporter-contract-and-artifact-manifest"
```

## Goal

Promote the Vitest reporter/helper toward public adoption-ready behavior using the shared reporter artifact contract.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- `packages/core/src/reporters/index.ts`
- `packages/vitest/package.json`
- relevant existing Vitest reporter source/tests

## Prior chunk evidence

- Added the experimental `agent-inspect/reporters` subpath without changing root exports.
- Added shared reporter contract types, deterministic manifest creation, safe artifact path helpers, and reporter failure diagnostics.
- Added focused tests for manifest ordering, path rejection, and diagnostics.
- Updated ESM/CJS subpath export coverage and consumer fixtures for `agent-inspect/reporters`.
- No framework dependency, network behavior, trace schema change, package version change, changeset, tag, or publication was introduced.

## In Scope

1. Implement Vitest reporter/helper lifecycle around the shared reporter contract.
2. Preserve quiet success by default.
3. Generate useful local artifacts for failed tests only.
4. Preserve original Vitest failures and exit behavior.
5. Add focused Vitest reporter tests and package smoke/compat coverage as needed.
6. Keep package publication/private-state decisions explicit.

## Out Of Scope

- Jest reporter implementation;
- hosted uploads;
- GitHub API comments/checks;
- changesets;
- tags;
- publishing;
- root/core framework dependencies;
- schema changes to persisted traces;
- first publication without maintainer confirmation.

## Acceptance Criteria

- Failed Vitest tests produce deterministic local artifact metadata.
- Successful Vitest tests remain quiet by default.
- Reporter failures become diagnostics and do not mask test failures.
- `vitest` remains a peer dependency of `@agent-inspect/vitest`, not a root/core dependency.
- If `@agent-inspect/vitest` is made public, the first-publication gate remains documented for the maintainer before v2.2 release.

## Suggested Commit

```text
feat(vitest): publish trace test reporter
```

## Focused Tests

```bash
pnpm exec vitest run packages/vitest/test
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

Stop on unrelated worktree changes, maintainer-only publication setup, reporter package publication decisions that require npm setup, root/core dependency requirements, schema changes, network behavior expansion, Jest-specific lifecycle decisions, or validation failures that cannot be repaired in this chunk.
