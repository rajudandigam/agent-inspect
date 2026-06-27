# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-1-contract-inventory-and-schema-1.0-freeze"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-0-train-setup-and-v1.9-publication-reconciliation"
```

## Goal

Inventory the current public contracts and freeze schema 1.0 decisions before v2 implementation chunks begin.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`
- `docs/proposals/STABLE-SCHEMA-1.0.md`

## In scope

1. Inventory current root/subpath exports, persisted contracts, readers, writers, checks, exporters, and CLI commands.
2. Freeze schema 1.0 decisions that are already covered by the roadmap/RFC.
3. Define migration acceptance criteria and fixture names for later chunks.
4. Identify every intended v2 breaking change before code changes.
5. Update release-train state and current-task pointers.

## Out of scope

- schema 1.0 implementation;
- writer/read-path changes;
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

- Contract inventory records the current root/subpath/export/CLI/schema surface.
- Schema 1.0 RFC records frozen decisions for implementation.
- Migration acceptance criteria and fixture names are listed.
- Intended v2 breaking changes are explicit and limited.
- No runtime, schema implementation, package export, dependency, version, changeset, publish, or release artifact changes occur.

## Completion evidence

- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1087 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
docs: freeze v2 contract inventory
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema implementation, package export, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
