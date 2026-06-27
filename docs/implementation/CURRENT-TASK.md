# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-2-schema-1.0-model-validator-and-fixtures"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-1-contract-inventory-and-schema-1.0-freeze"
```

## Goal

Add schema 1.0 types, validation helpers, reader detection, and canonical fixtures while keeping v0.1/v0.2 compatibility intact.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/proposals/STABLE-SCHEMA-1.0.md`
- `docs/implementation/release-trains/V2.0.0-CONTRACT-INVENTORY.md`

## In scope

1. Extend the persisted event model and guards to accept `schemaVersion: "1.0"`.
2. Expose schema-specific persisted guards through `agent-inspect/persisted`.
3. Teach AgentInspect JSONL parsing/detection/readers about v1.0 while preserving v0.1/v0.2 behavior.
4. Add canonical v1.0 fixtures and fixture validation.
5. Add focused persisted/read-trace/readers tests.
6. Update release-train state and current-task pointers.

## Out of scope

- writer default/output routing changes;
- root export removals or package export changes;
- migration CLI implementation;
- version changes, changesets, tags, npm publish, GitHub releases, or force pushes;
- new root/core dependencies;
- new root/core adapter dependencies;
- live provider calls, hosted tracing, or upload behavior.

## Focused validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- `isPersistedInspectEvent` accepts v0.2 and v1.0 rows while rejecting unsupported schema versions.
- `agent-inspect/persisted` exports v0.2/v1.0-specific guards.
- `parseTraceJsonl`, `detectTraceFormat`, and `readTrace` support v1.0 JSONL and mixed v0.1/v0.2/v1.0 rows.
- Canonical v1.0 fixtures validate and include safe unknown optional-field preservation.
- No writer default, package export route, dependency, version, changeset, publish, or release artifact changes occur.

## Completion evidence

- `CI=true pnpm exec vitest run packages/core/test/persisted packages/core/test/types/persisted-inspect-event.test.ts packages/core/test/read-trace.test.ts packages/core/test/schema-compatibility.test.ts packages/core/test/readers.test.ts` passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
- 123 files passed, 1092 tests passed.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `git diff --check` passed.

## Proposed commit

```text
feat: add schema 1.0 persisted fixtures
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring writer default changes, root/package export changes, migration CLI design, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
