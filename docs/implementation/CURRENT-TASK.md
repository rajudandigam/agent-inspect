# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-0-train-setup-and-v1.9-publication-reconciliation"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-release-prep-and-partial-publication"
```

## Goal

Record the deferred v1.9 OpenAI Agents publish recovery, prevent ordinary pushes from retrying that deferred publish, and start the v2.0 stable-contract release train.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V1.9.0-RELEASE-READINESS.md`
- `docs/implementation/ROADMAP-V1.8.1-TO-V3.md`

## In scope

1. Record the v1.9.0 partial publication state and deferred OpenAI Agents recovery.
2. Create the v2.0.0 execution plan from the active roadmap.
3. Update release-train state and current-task pointers.
4. Add a narrow publish-workflow guard so ordinary non-release pushes run validation but skip Changesets publish automation.
5. Keep this chunk limited to docs/state and release-workflow safety.

## Out of scope

- publishing or recovering `@agent-inspect/openai-agents@1.9.0`;
- first public `@agent-inspect/harness` publication;
- private Vitest/Jest reporter publication;
- version changes, changesets, tags, npm publish, GitHub releases, or force pushes;
- v2 schema implementation;
- root export removals or breaking import changes;
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

- Release-train state names the exact v1.9 partial publication state.
- v2.0 execution plan defines ordered chunks and gates.
- Current task points to v2.0 chunk 0.
- No runtime, schema, dependency, version, package manifest, changeset, publish, or release artifact changes occur.
- Ordinary non-release pushes skip the Changesets publish step while changeset commits, Version Packages merges, and manual dispatch can still run release automation.

## Completion evidence

- `CI=true pnpm typecheck` passed.
- `CI=true pnpm test` passed.
  - 123 files passed, 1087 tests passed.
- `git diff --check` passed.
- Release-work detector logic was exercised locally against the current Version Packages merge commit.

## Proposed commit

```text
chore: start v2 train and guard publish retry
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema implementation, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
