# Current Codex Task

## Identity

```yaml
train: "v1.7.0"
chunk: "v1.7-changesets-release-pr"
status: "pending-automation"
dependsOn: "v1.7-release-readiness"
```

## Goal

Allow the repository Changesets workflow to create the v1.7 Version Packages PR, validate that PR, and merge it only if CI remains green and package metadata is safe.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.7.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V1.7.0-RELEASE-READINESS.md`
- `.github/workflows/publish.yml`
- `.changeset/config.json`

## In scope

1. Confirm the Changesets action opens a v1.7 Version Packages PR from the pushed changeset.
2. Confirm the PR bumps the linked public package set to `1.7.0`: `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`, and `@agent-inspect/ai-sdk`.
3. Confirm `@agent-inspect/openai-agents` remains private and unpublished.
4. Validate the PR checks before merge.
5. After merge, confirm the publish workflow publishes v1.7.0 and creates package tags/releases.

## Out of scope

- local `npm publish`, `pnpm publish`, or `changeset publish`
- manual tag or GitHub release creation
- package implementation changes beyond release automation fixes
- default network upload behavior or hosted sinks

## Acceptance criteria

- Existing public packages report `1.7.0` on npm.
- New `@agent-inspect/ai-sdk` package reports `1.7.0` on npm.
- `@agent-inspect/openai-agents` remains unpublished/private.
- Release train state records v1.7.0 as published.

## Stop condition

Stop if the Version Packages PR contains unexpected package bumps, CI fails for a reason outside release automation scope, npm Trusted Publishing is missing for the new `@agent-inspect/ai-sdk` package, or local publishing credentials would be required.
