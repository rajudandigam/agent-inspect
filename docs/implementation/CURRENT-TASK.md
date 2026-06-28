# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-release-prep"
status: "release-prep"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-reporter-first-publication-bootstrap"
```

## Goal

Prepare the v2.2.0 linked minor release after maintainer manual bootstrap and Trusted Publishing setup for `@agent-inspect/vitest` and `@agent-inspect/jest`.

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
- `@agent-inspect/vitest` and `@agent-inspect/jest` are visible on npm at `2.1.0` with `bootstrap` and `latest` dist-tags.
- Maintainer confirmed Trusted Publishing is enabled for both reporter package records.
- v2.2 release-readiness validation passed locally in `docs/implementation/release-trains/V2.2.0-RELEASE-READINESS.md`.

## In Scope

1. Remove `@agent-inspect/vitest` and `@agent-inspect/jest` from Changesets ignore.
2. Add both reporter packages to the linked public package set.
3. Add a linked minor changeset for v2.2.0 across the public package set.
4. Validate the Changesets plan and release-prep gates.
5. Push release-prep changes to `main` and wait for the Version Packages PR.

## Out Of Scope

- Manual package version edits;
- local `npm publish` / `pnpm publish`;
- direct tag creation;
- manual GitHub releases;
- runtime reporter behavior changes;
- GitHub API comments/checks;
- artifact upload by AgentInspect;
- new dependencies;
- schema changes.

## Acceptance Criteria

- Changesets status reports exactly nine linked public packages planned for minor v2.2.0.
- Reporter packages are no longer ignored by Changesets.
- No package versions are hand-edited.
- Validation passes.
- Version Packages PR is created by automation after push.

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
pnpm build
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Stop Condition

Stop if Changesets plans a patch/major release, omits a public linked package, includes a private package, validation fails outside this release-prep scope, the Version Packages PR diff is broader than expected, or publish automation partially fails.
