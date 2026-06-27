# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-1-harness-package-boundary-and-core-runner"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-0-train-setup"
```

## Goal

Add the private `@agent-inspect/harness` workspace package boundary and a no-framework core runner contract for local fixture targets.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`

## In scope

1. Add private workspace package `@agent-inspect/harness`.
2. Define `defineTarget`, `createFixtureRunner`, public types, and the core runner contract.
3. Support target resolution/invocation, bootstrap/shutdown hooks, local trace options, and deterministic diagnostics.
4. Add focused package tests, package-boundary coverage, API docs, and build/test wiring.

## Out of scope

- package version changes;
- changesets, tags, npm publish, GitHub releases, or first public package publication;
- provider/network implementation;
- schema changes;
- new root/core dependencies;
- harness CLI fixture loading, JSON stdin/stdout ergonomics, recipes, or expected-output comparison.

## Focused validation

```bash
pnpm exec vitest run packages/harness/test/index.test.ts packages/core/test/package-boundaries.test.ts
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

## Acceptance criteria

- `@agent-inspect/harness` exists as a private workspace package.
- The package exposes typed `defineTarget` and `createFixtureRunner` APIs.
- Runner execution is deterministic, local-only, and supports env-gated or explicit trace options through existing AgentInspect APIs.
- Bootstrap, resolve, invoke, and shutdown failures are exposed through diagnostics.
- Package boundaries keep root/core dependencies unchanged and avoid framework/runtime dependencies.

## Completion evidence

- `CI=true pnpm exec vitest run packages/harness/test/index.test.ts packages/core/test/package-boundaries.test.ts` passed: 2 test files passed, 16 tests passed.
- `CI=true pnpm build` passed, including `tsup.harness.config.ts` for the private harness package.
- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed: 122 test files passed, 1078 tests passed.
- `git diff --check` passed.

## Proposed commit

```text
feat: add private harness runner package
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
