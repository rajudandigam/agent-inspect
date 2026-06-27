# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-5-v2-root-api-contract"
status: "validated_pending_commit"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-4-migration-dry-run-cli"
```

## Goal

Enforce the intended small v2 root API contract and move advanced usage to documented subpaths without changing package routes or runtime behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.0.0-CONTRACT-INVENTORY.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Shrink the root value export surface to the v2 allowlist.
2. Keep root type exports limited to stable user-facing contracts.
3. Move advanced/runtime/reader/writer/export/log/diff/check usage to owning subpaths.
4. Update API/subpath stability tests, consumer compatibility fixtures, and in-repo test resolver aliases.
5. Refresh public docs snippets that would otherwise contradict the v2 root contract.
6. Update release-train state and current-task pointers.

## Out of scope

- package export route changes;
- schema or persisted model changes;
- migration behavior changes;
- new dependencies;
- runtime, writer, reader, exporter, or CLI behavior changes beyond import ownership;
- version changes, changesets, tags, npm publish, GitHub releases, force pushes, or release artifacts;
- hosted upload, provider/network, replay, or cost-engine behavior.

## Focused validation

```bash
pnpm exec vitest run packages/core/test/api-stability.test.ts packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/consumer-compat.test.ts
pnpm build
pnpm typecheck
pnpm test
pnpm compat:smoke
pnpm pack:smoke
git diff --check
```

## Acceptance criteria

- Root runtime exports are limited to `createInspector`, `inspectRun`, `maybeInspectRun`, `step`, `observe`, and `getCurrentCorrelationMetadata`.
- Root type exports remain limited to the v2 stable user-facing contract.
- Advanced APIs remain available from their documented subpaths.
- CLI, adapters, recipes, and tests no longer rely on advanced root imports.
- Consumer compatibility continues to pass for root beginner APIs and subpath imports.
- No package versions, package export routes, dependencies, tags, publishes, or releases change.

## Completion evidence

- Starting commit: `6c6eb1047c038e89e5ab0c82d7becb723f66db46`.
- `CI=true pnpm exec vitest run packages/core/test/api-stability.test.ts packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/consumer-compat.test.ts` passed.
  - 4 files passed, 26 tests passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 124 files passed, 1101 tests passed.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm compat:smoke` passed.
  - Used an isolated npm cache because the local user npm cache has root-owned files.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm pack:smoke` passed.
  - Used an isolated npm cache because the local user npm cache has root-owned files.

## Proposed commit

```text
feat: enforce v2 root api contract
```

## Next chunk

Chunk 6 — docs and migration guide alignment.

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring schema redesign, dependency changes, package export routes, version changes, changesets, release, tag, publish, hosted upload, provider/network, replay, or cost-engine behavior.
