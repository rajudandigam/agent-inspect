# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-7-release-readiness"
status: "validated_pending_commit"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-6-docs-and-migration-guide-alignment"
```

## Goal

Run the v2.0.0 release-readiness gate, inspect package contents and release metadata state, prepare release notes and the RC/stable decision record, then stop for maintainer release authorization.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.0.0-RELEASE-READINESS.md`

## In scope

1. Run the full release-readiness validation matrix.
2. Inspect root package dry-run contents and package smoke evidence.
3. Verify no unauthorized versions, changesets, tags, npm publishes, GitHub releases, or Version Packages PRs were created.
4. Prepare the v2.0.0 release-readiness evidence, release notes draft, and RC/stable decision record.
5. Update release-train state and current-task pointers.

## Out of scope

- source/runtime/schema behavior changes;
- package export route changes;
- version changes, changesets, tags, npm publish, GitHub releases, force pushes, or release artifacts;
- new dependencies;
- hosted upload, provider/network, replay, or cost-engine behavior.

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

- Full release-readiness matrix passes locally.
- Package dry-run contents include expected root docs, CLI dist, and core subpath dist/declarations.
- No changeset markdown files, v2 tags, v2 GitHub releases, npm publishes, or Version Packages PRs are created.
- Release notes draft and RC/stable decision record are documented.
- No package versions, package export routes, dependencies, tags, publishes, or releases change.

## Completion evidence

- Starting commit: `99f5a1b7e14d6e4181e2e0255febf9608d67aa25`.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 124 files passed, 1101 tests passed.
- `CI=true pnpm test:coverage` passed.
  - 124 files passed, 1101 tests passed; all-files coverage statements 81.12%, branches 79.44%, functions 95.36%, lines 81.12%.
- `CI=true pnpm size` passed.
  - Size limit 120 kB; measured 11.31 kB.
- `CI=true pnpm test:all` passed.
  - Re-ran typecheck, test, build, and size; test phase passed 124 files / 1101 tests.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm compat:smoke` passed.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm pack:smoke` passed.
- `npm_config_cache=/private/tmp/agent-inspect-npm-cache npm pack --dry-run` passed.
  - `agent-inspect-1.9.0.tgz`; 118 files; 1.3 MB packed; 6.2 MB unpacked.
- `git diff --check` passed.

## Proposed commit

```text
docs: prepare v2 release readiness
```

## Next chunk

Manual gate — v2 release authorization and release workflow.

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring schema redesign, dependency changes, package export routes, version changes, changesets, release, tag, publish, hosted upload, provider/network, replay, or cost-engine behavior.

After the readiness commit is pushed and remote CI/Publish are green, stop for maintainer authorization before any versioning, Changesets workflow, tag, npm publish, GitHub release, or v2 stable release creation.
