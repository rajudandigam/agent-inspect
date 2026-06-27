# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-2-harness-cli-ergonomics-and-recipes"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-1-harness-package-boundary-and-core-runner"
```

## Goal

Add harness command-line ergonomics and deterministic no-network recipes for local fixture execution.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`

## In scope

1. Implement `runFromArgv()` target listing, fixture file loading, JSON stdin, JSON stdout, stderr summary, expected-output comparison, and graceful failure behavior.
2. Add deterministic `harness-basic` and adapter-shaped harness recipes without live vendor calls.
3. Update examples/docs and focused tests.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- provider/network implementation;
- schema changes;
- new root/core dependencies;
- live vendor calls or adapter SDK dependencies.

## Focused validation

```bash
pnpm exec vitest run packages/harness/test/index.test.ts packages/core/test/recipes-smoke.test.ts
pnpm recipes:check
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- `runFromArgv()` supports listing, fixture files, stdin JSON, stdout JSON, stderr summaries, trace options, and expected-output comparison.
- CLI-style failures return deterministic JSON results and diagnostics without process exits.
- Recipes are local-only, deterministic, and validated by `recipes:check`.
- No root/core dependency, version, schema, network, publish, or release behavior changes occur.

## Completion evidence

- `CI=true pnpm exec vitest run packages/harness/test/index.test.ts packages/core/test/recipes-smoke.test.ts` passed: 2 test files passed, 11 tests passed.
- `CI=true pnpm recipes:check` passed: 19 recipes validated.
- `CI=true pnpm build` passed, including the updated harness package.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed: 122 test files passed, 1081 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
feat: add harness argv runner recipes
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
