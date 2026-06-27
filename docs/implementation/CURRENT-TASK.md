# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-7-release-readiness"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-6-root-api-slimming-plan-and-enforcement"
```

## Goal

Prepare v1.9.0 release-readiness evidence and stop before manual release-prep operations.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V1.9.0-RELEASE-READINESS.md`

## In scope

1. Prepare v1.9.0 release-readiness evidence and release notes draft.
2. Inspect package contents.
3. Verify no unauthorized versions, changesets, tags, publishes, or releases occurred.
4. Stop for maintainer release-prep authorization.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- root export removals or breaking import changes;
- schema changes;
- new root/core dependencies;
- new root/core adapter dependencies;
- live provider calls, hosted tracing, or upload behavior.

## Focused validation

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm compat:smoke
pnpm pack:smoke
npm pack --dry-run
git diff --check
```

## Acceptance criteria

- Release-readiness record includes exact validation evidence and package contents evidence.
- Release notes draft covers harness, explain, adapter promotion, and root API slimming work.
- No unauthorized versions, changesets, tags, publishes, releases, or release PRs occurred.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.
- Manual maintainer release-prep remains the only next step.

## Completion evidence

- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1087 tests passed.
- `CI=true pnpm test:coverage` passed.
  - 123 files passed, 1087 tests passed.
  - All-files coverage: statements 81.13%, branches 79.28%, functions 94.81%, lines 81.13%.
- `CI=true pnpm size` passed.
  - Size 39.6 kB with all dependencies, minified and brotlied; limit 120 kB.
- `CI=true pnpm test:all` passed.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true pnpm compat:smoke` passed.
- `CI=true pnpm pack:smoke` passed.
- `npm pack --dry-run` passed.
  - Root dry-run tarball `agent-inspect-1.8.0.tgz`; 126 files; 1.4 MB package size; 6.7 MB unpacked; shasum `3e75c63f292d82449cdb7f037039070be1990070`.
- `git diff --check` passed after final readiness/state edits.

## Proposed commit

```text
docs: prepare v1.9 release readiness
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
