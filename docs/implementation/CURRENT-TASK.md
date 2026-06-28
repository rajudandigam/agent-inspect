# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-reporter-first-publication-bootstrap"
status: "manual-bootstrap-ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-5-reporter-docs-package-smoke-and-readiness"
```

## Goal

Await maintainer manual first-publication bootstrap for `@agent-inspect/vitest` and `@agent-inspect/jest`. npm requires package records before Trusted Publishing can be enabled, so the reporter packages are prepared as public `2.1.0` bootstrap packages while remaining ignored by Changesets until the normal v2.2 release prep.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.2.0-RELEASE-READINESS.md`
- `docs/implementation/release-trains/V2.2.0-REPORTER-FIRST-PUBLICATION-BOOTSTRAP.md`
- `docs/proposals/CI-REPORTERS.md`

## Current Evidence

- Vitest and Jest reporters write shared `0.1` artifact manifests through `agent-inspect/reporters`.
- `agent-inspect ci-summary` reads reporter manifests and writes deterministic Markdown/JSON summaries without reading trace contents.
- GitHub Actions artifact recipes rely on user-controlled `upload-artifact`; AgentInspect performs no uploads or GitHub API writes.
- `@agent-inspect/vitest` and `@agent-inspect/jest` are prepared as public `2.1.0` bootstrap packages so npm package records can be created manually.
- The reporter packages remain ignored by Changesets until bootstrap publication and Trusted Publishing setup are complete.
- v2.2 release-readiness validation passed locally in `docs/implementation/release-trains/V2.2.0-RELEASE-READINESS.md`.

## In Scope

1. Maintainer manually publishes `@agent-inspect/vitest@2.1.0` with `bootstrap` tag.
2. Maintainer manually publishes `@agent-inspect/jest@2.1.0` with `bootstrap` tag.
3. Maintainer enables Trusted Publishing for both npm package records.
4. Maintainer reports `npm view` evidence for both packages.
5. After confirmation, proceed to the normal v2.2 release-prep task/chunk.

## Out Of Scope

- v2.2 package version bumps before maintainer release authorization;
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

- Maintainer confirms both reporter package records exist on npm.
- Maintainer confirms Trusted Publishing is enabled for both reporter packages.
- Maintainer confirms the linked v2.2 public package set.
- Maintainer explicitly authorizes release prep and publication workflow after bootstrap.
- No v2.2 changeset, tag, publish, or release is created before authorization.

## Suggested Commit

```text
chore: prepare reporter package bootstrap
```

## Focused Tests

```bash
pnpm pack:smoke
```

## Chunk Gate

```bash
pnpm build
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Stop Condition

Stop until maintainer manually publishes both reporter bootstrap packages, enables Trusted Publishing, and explicitly authorizes normal v2.2 release prep.
