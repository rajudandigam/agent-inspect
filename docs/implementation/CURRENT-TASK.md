# Current Codex Task

## Identity

```yaml
train: "v1.9.0"
chunk: "v1.9-release-prep-and-publication"
status: "in_progress"
executionMode: "autonomous-release-train"
dependsOn: "v1.9-7-release-readiness"
```

## Goal

Prepare and execute the v1.9.0 minor release workflow through GitHub Changesets automation.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.9.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V1.9.0-RELEASE-READINESS.md`

## In scope

1. Add a v1.9.0 minor Changeset for the existing public linked packages.
2. Keep `@agent-inspect/harness`, `@agent-inspect/vitest`, and `@agent-inspect/jest` private/unpublished.
3. Run the standard release workflow validation.
4. Push the release-prep commit to `main`.
5. Let GitHub Changesets create the Version Packages PR, merge it only after green checks, and verify publication.

## Out of scope

- first public `@agent-inspect/harness` publication;
- private Vitest/Jest reporter publication;
- patch releases;
- force pushes, manual local npm publish, or bypassing CI;
- root export removals or breaking import changes;
- schema changes;
- new root/core dependencies;
- new root/core adapter dependencies;
- live provider calls, hosted tracing, or upload behavior.

## Focused validation

```bash
pnpm exec changeset status --verbose
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- Changesets plans exactly five public linked minor bumps to `1.9.0` and no patch or major releases.
- Harness remains private and is excluded from this public release.
- GitHub release workflow creates and validates a Version Packages PR.
- Publish workflow publishes only the authorized public packages.
- No root/core dependency, schema, network, provider, hosted upload, or replay behavior changes occur.

## Completion evidence

- Maintainer authorized release-prep and publish after the readiness gate.
- `CI=true pnpm exec changeset status --verbose` passed.
  - Minor bumps only: `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/ai-sdk`, and `@agent-inspect/openai-agents` to `1.9.0`.
  - No patch or major releases.
- `CI=true pnpm test:all` passed.
  - 123 files passed, 1087 tests passed.
  - Size 39.6 kB with all dependencies, minified and brotlied; limit 120 kB.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true pnpm pack:smoke` passed.
- `CI=true pnpm compat:smoke` passed.
- `git diff --check` passed.

## Proposed commit

```text
chore: prepare v1.9.0 changeset release
```

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, or any decision requiring runtime, schema, dependency, version, changeset, release, tag, publish, hosted upload, provider/network, replay, or cost-engine changes.
