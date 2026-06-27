# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-6-root-api-slimming-plan-and-enforcement"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-5-adapter-promotion"
```

## Goal

Document the v2 root API direction and enforce that new advanced root exports require explicit review.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Document stable root imports and a v2 migration table.
2. Ensure advanced examples use subpaths.
3. Add or update tests that prevent accidental new advanced root exports.
4. Add JSDoc deprecation notes only where practical and non-breaking.

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
pnpm exec vitest run packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/api-stability.test.ts
pnpm build
pnpm typecheck
pnpm test
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- Docs identify the intended small stable root import set and v2 migration path.
- Advanced examples continue to use subpaths.
- Tests fail on accidental new root value exports.
- Existing 1.x root imports remain valid.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.

## Completion evidence

- Focused root/subpath tests passed:
  `CI=true pnpm exec vitest run packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/api-stability.test.ts`
  - 3 files passed, 20 tests passed.
- `CI=true pnpm build` passed.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1087 tests passed.
- `CI=true pnpm compat:smoke` passed.
- `git diff --check` passed.

## Proposed commit

```text
docs: document v2 root api path
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
