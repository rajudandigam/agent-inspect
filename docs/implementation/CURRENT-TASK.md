# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-5-reporter-docs-package-smoke-and-readiness"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-4-ci-summary-command-and-recipes"
```

## Goal

Finalize public docs, package-smoke evidence, and v2.2 release readiness for the reporter and CI workflow train.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- `README.md`
- `docs/API.md`
- `docs/CLI.md`
- `docs/CI-ARTIFACTS.md`
- reporter package manifests and package-smoke script

## Prior chunk evidence

- Vitest and Jest reporters write shared `0.1` artifact manifests through `agent-inspect/reporters`.
- `agent-inspect ci-summary` reads reporter manifests and writes deterministic Markdown/JSON summaries without reading trace contents.
- GitHub Actions artifact recipes rely on user-controlled `upload-artifact`; AgentInspect performs no uploads or GitHub API writes.
- `@agent-inspect/vitest` and `@agent-inspect/jest` remain private pending maintainer first-publication setup before v2.2 release.

## In Scope

1. Update public docs so reporter and `ci-summary` behavior matches implementation.
2. Verify package file lists and package-smoke behavior remain explicit for private reporter packages.
3. Add v2.2 release readiness evidence.
4. Draft changelog/readiness notes without versioning or publishing.
5. Keep first-publication gates for reporter packages clear.

## Out Of Scope

- Package version bumps;
- changesets;
- tags;
- publishing;
- GitHub releases;
- runtime reporter behavior changes;
- GitHub API comments/checks;
- artifact upload by AgentInspect;
- new dependencies;
- schema changes.

## Acceptance Criteria

- README/API/CLI/CI docs describe reporter artifacts and `ci-summary` accurately.
- Release readiness records validation evidence and package publication state.
- Reporter packages remain private unless maintainer explicitly clears first-publication setup.
- Changelog notes are draft/unreleased only.
- No package version, changeset, tag, publish, or release is created in this chunk.

## Suggested Commit

```text
docs: prepare v2.2 release readiness
```

## Focused Tests

```bash
pnpm recipes:check
pnpm pack:smoke
```

## Chunk Gate

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Stop Condition

Stop on unrelated worktree changes, package publication decisions that require maintainer confirmation, missing first-publication setup, version/tag/publish requirements, changeset requirements, release-state conflicts, or validation failures that cannot be repaired in this chunk.
