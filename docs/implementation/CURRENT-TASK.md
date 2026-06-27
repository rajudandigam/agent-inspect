# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-4-migration-dry-run-cli"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-3-schema-1.0-writer-read-path"
```

## Goal

Add a local, non-destructive migration command for converting AgentInspect JSONL traces to the schema 1.0 persisted contract.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/proposals/STABLE-SCHEMA-1.0.md`
- `docs/implementation/release-trains/V2.0.0-CONTRACT-INVENTORY.md`

## In scope

1. Add `agent-inspect migrate <input> --to 1.0 --dry-run`.
2. Add explicit `--output <path>` mode that refuses to overwrite the input trace.
3. Emit deterministic summaries and line warnings for malformed or unsupported rows.
4. Preserve v0.2/v1.0 persisted rows and convert v0.1 trace rows to v1.0 persisted rows.
5. Add traversal, malformed input, and non-mutating tests.
6. Keep the CLI help/package smoke aware of the new command.
7. Update release-train state and current-task pointers.

## Out of scope

- destructive in-place migration;
- directory-wide migration;
- migration to schema versions other than 1.0;
- schema changes beyond the existing schema 1.0 persisted contract;
- root export removals or package export changes;
- version changes, changesets, tags, npm publish, GitHub releases, or force pushes;
- new root/core dependencies;
- hosted upload, provider/network, replay, or cost-engine behavior.

## Focused validation

```bash
pnpm exec vitest run packages/cli/test/migrate.test.ts packages/core/test/migration packages/core/test/trace-verification.test.ts
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
git diff --check
```

## Acceptance criteria

- `agent-inspect migrate <input> --to 1.0 --dry-run` reports deterministic counts and writes no files.
- `--output <path>` writes schema 1.0 JSONL to a separate file and creates parent directories.
- The command refuses input overwrite and output traversal outside the input directory.
- Malformed JSON and unsupported schema rows produce stable warnings without mutating input.
- v0.1/v0.2/v1.0 input rows remain readable and convertible without new dependencies.
- No version, changeset, tag, publish, or release artifact changes occur.

## Completion evidence

- `CI=true pnpm exec vitest run packages/cli/test/migrate.test.ts packages/cli/test/cli.test.ts packages/core/test/migration packages/core/test/trace-verification.test.ts` passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 124 files passed, 1101 tests passed.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm pack:smoke` passed.
  - Added because the packed CLI help smoke now checks `migrate`.
  - Used an isolated npm cache because the local user npm cache has root-owned files.
- `git diff --check` passed.

## Proposed commit

```text
feat: add schema migration dry-run cli
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring in-place migration, directory-wide migration, schema redesign, root/package export changes, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
