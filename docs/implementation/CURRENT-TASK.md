# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-release-prep-manual-gate"
status: "manual-gate"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-5-reporter-docs-package-smoke-and-readiness"
```

## Goal

Await maintainer confirmation before v2.2 release prep. The v2.2 reporter and CI workflow implementation chunks are complete and locally release-ready, but release prep requires manual package/publication decisions for the private reporter packages.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.2.0-RELEASE-READINESS.md`
- `docs/proposals/CI-REPORTERS.md`

## Current Evidence

- Vitest and Jest reporters write shared `0.1` artifact manifests through `agent-inspect/reporters`.
- `agent-inspect ci-summary` reads reporter manifests and writes deterministic Markdown/JSON summaries without reading trace contents.
- GitHub Actions artifact recipes rely on user-controlled `upload-artifact`; AgentInspect performs no uploads or GitHub API writes.
- `@agent-inspect/vitest` and `@agent-inspect/jest` remain private pending maintainer first-publication setup before v2.2 release.
- v2.2 release-readiness validation passed locally in `docs/implementation/release-trains/V2.2.0-RELEASE-READINESS.md`.

## In Scope

1. Confirm maintainer first-publication setup for `@agent-inspect/vitest` and `@agent-inspect/jest`.
2. Confirm whether reporter packages should join the linked public package set for v2.2.
3. Confirm explicit authorization for v2.2 versioning, Changesets release prep, tags, GitHub releases, and npm publication.
4. After confirmation, create the v2.2 release-prep task/chunk.

## Out Of Scope

- Package version bumps before maintainer release authorization;
- changesets before maintainer release authorization;
- tags before maintainer release authorization;
- publishing before maintainer release authorization;
- GitHub releases before maintainer release authorization;
- runtime reporter behavior changes;
- GitHub API comments/checks;
- artifact upload by AgentInspect;
- new dependencies;
- schema changes.

## Acceptance Criteria

- Maintainer confirms first-publication setup for both reporter packages or decides to defer them.
- Maintainer confirms the linked v2.2 public package set.
- Maintainer explicitly authorizes release prep and publication workflow.
- No package version, changeset, tag, publish, or release is created before authorization.

## Suggested Commit

```text
chore: prepare v2.2 release
```

## Focused Tests

```bash
pnpm exec changeset status --verbose
```

## Chunk Gate

```bash
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Stop Condition

Stop until maintainer explicitly clears the reporter package publication decision and v2.2 release authorization.
