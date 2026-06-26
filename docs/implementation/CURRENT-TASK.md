# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-0-planning-reset"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.7.0-published"
```

## Goal

Align repository state and documentation with the published v1.7.0 baseline, adopt the finalized v1.8 plan, and prepare the first AI SDK correctness task without changing runtime behavior in this chunk.

## Read first

- `AGENTS.md`
- `ROADMAP.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.7.0-RELEASE-READINESS.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md`
- `docs/implementation/CODEX-MAINTAINER-GUIDE.md`

## In scope

1. Verify clean `main`, current commit, merged release PR, package manifests, and live npm versions.
2. Correct stale v1.7 statuses in `ROADMAP.md`, state, current task, v1.7 execution plan, adapters documentation, and changelog.
3. Make `ROADMAP-V1.8-TO-V3.md` the active maintainer roadmap and update the `AGENTS.md` pointer.
4. Confirm the v1.8 execution plan includes all corrective and check/CI chunks.
5. Add the narrowly scoped autonomous release-train rules to `AGENTS.md` and the maintainer guide.
6. Replace `CURRENT-TASK.md` with chunk 1 after validation, then continue under autonomous mode.

## Out of scope

- runtime/source changes;
- package version changes or changesets;
- local npm publishing;
- check API design beyond the execution-plan boundary;
- schema changes, dependencies, or network behavior.

## Acceptance criteria

- docs consistently report v1.7.0 as published;
- current train is v1.8.0;
- active roadmap and plan links are correct;
- deferred v1.7 work is recorded honestly;
- autonomous mode retains one commit and one gate per chunk;
- the next task is AI SDK logical event identity and canonical round-trip correctness.

## Validation

```bash
pnpm typecheck
pnpm test
git diff --check
```

## Proposed commit

```text
docs: start v1.8 deterministic checks train
```

## Stop condition

Stop only on unrelated worktree changes, Git/npm state inconsistent with a completed v1.7.0 publication, or material conflict with the finalized roadmap.
