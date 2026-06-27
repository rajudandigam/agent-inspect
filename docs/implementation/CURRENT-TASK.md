# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-3-schema-1.0-writer-read-path"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-2-schema-1.0-model-validator-and-fixtures"
```

## Goal

Route core built-in inspector writer output through the schema 1.0 persisted contract while preserving writer safety, diagnostics, and legacy trace readability.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/proposals/STABLE-SCHEMA-1.0.md`
- `docs/implementation/release-trains/V2.0.0-CONTRACT-INVENTORY.md`

## In scope

1. Make `createInspector()` emit schema 1.0 persisted events.
2. Preserve schema 1.0 extension fields through built-in writer safety when safe.
3. Keep persisted redaction, metadata bounds, final size limits, serialization isolation, and writer diagnostics intact.
4. Keep schema 0.1 and 0.2 traces readable.
5. Add focused inspector/writer/read compatibility coverage.
6. Update release-train state and current-task pointers.

## Out of scope

- optional adapter package output changes;
- global/manual schema 0.1 trace helper changes;
- root export removals or package export changes;
- migration CLI implementation;
- version changes, changesets, tags, npm publish, GitHub releases, or force pushes;
- new root/core dependencies;
- live provider calls, hosted tracing, upload behavior, replay, or cost-engine behavior.

## Focused validation

```bash
pnpm exec vitest run packages/core/test/writers packages/core/test/storage.test.ts packages/core/test/read-trace.test.ts packages/core/test/schema-compatibility.test.ts
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- `createInspector()` lifecycle rows use `schemaVersion: "1.0"`.
- Built-in writers persist schema 1.0 rows after redaction, bounding, JSON safety, and size enforcement.
- Schema 1.0 unknown optional top-level fields are preserved when safe.
- Legacy schema 0.2 persisted rows remain accepted by built-in writers.
- Existing schema 0.1 and mixed schema read paths remain green.
- No adapter, dependency, version, changeset, publish, tag, or release artifact changes occur.

## Completion evidence

- `CI=true pnpm exec vitest run packages/core/test/writers packages/core/test/storage.test.ts packages/core/test/read-trace.test.ts packages/core/test/schema-compatibility.test.ts packages/core/test/inspector.test.ts` passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1095 tests passed.
- `CI=true pnpm test:coverage` passed.
- `CI=true pnpm size` passed.
  - 39.91 kB brotlied against the 120 kB limit.
- `CI=true pnpm test:all` passed.
  - 123 files passed, 1094 tests passed, 1 skipped.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm pack:smoke` passed.
  - Used an isolated npm cache because the local user npm cache has root-owned files.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm compat:smoke` passed.
  - Used the same isolated npm cache.
- `git diff --check` passed.

## Proposed commit

```text
feat: route inspector writer output to schema 1.0
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring adapter output changes, global/manual trace helper changes, root/package export changes, migration CLI design, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
