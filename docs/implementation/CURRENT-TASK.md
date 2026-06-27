# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-0-train-setup"
status: "completed"
executionMode: "autonomous-release-train"
dependsOn: "v1.8.1-1-docs-roadmap-maintainer-cleanup"
```

## Goal

Establish the v1.9.0 autonomous release train for adoption leverage.

The maintainer authorized the named v1.9 release train and clarified that AgentInspect releases minor versions only; v1.8.1 is reference cleanup and not a patch-release target.

Completed on 2026-06-27. The v1.9.0 plan now defines ordered chunks and gates for harness, explain, adapter promotion, root API slimming, and release readiness.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md` v1.9.0 section
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`

## In scope

1. Create the v1.9.0 execution plan with ordered chunks and gates.
2. Update release-train state and current-task pointers.
3. Encode the minor-only release policy and manual release gates.

## Out of scope

- runtime source changes;
- package version changes;
- changesets;
- npm publish, tags, or GitHub releases;
- first publication of any new package;
- provider/network implementation for explain;
- schema changes;
- new root/core dependencies.

## Focused validation

```bash
CI=true pnpm typecheck
CI=true pnpm test
git diff --check
```

## Acceptance criteria

- `V1.9.0-EXECUTION-PLAN.md` exists and defines ordered chunks and gates.
- `RELEASE-TRAIN-STATE.md` points to v1.9.0 and the active plan.
- `CURRENT-TASK.md` points to chunk 0.
- Release policy says v1.9.0 is the next release target and v1.8.1 is not a patch-release target.
- No version, changeset, tag, publish, release, runtime, schema, dependency, or network behavior change occurs.

## Completion evidence

- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed: 120 test files passed, 1 skipped; 1051 tests passed, 20 skipped.
- `git diff --check` passed.

## Proposed commit

```text
docs: start v1.9.0 adoption leverage train
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
