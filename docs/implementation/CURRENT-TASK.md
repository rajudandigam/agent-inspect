# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-20-release-readiness"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-19-recipes-docs-performance"
```

## Goal

Run the full release-readiness gate and create `docs/implementation/release-trains/V1.8.0-RELEASE-READINESS.md` with exact evidence, package contents, sizes, performance, compatibility, safety, known limitations, and honest adoption status.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 20
- v1.8 implementation docs and generated validation output from the release-readiness gate

## In scope

1. Run the full release-readiness validation once and capture exact evidence.
2. Verify package contents, subpath exports, optional package publish status, private/unpublished reporter status, and tarball smoke results.
3. Record size, performance baseline, compatibility, safety, docs, schema compatibility, and known limitations.
4. Prepare an honest release-readiness document for maintainer review.
5. Keep release actions gated on maintainer approval.

## Out of scope

- package version changes, changesets, npm publication, tags, GitHub releases, or release note conversion;
- changing package publish status except where explicitly authorized by the maintainer during release readiness;
- hosted upload behavior, GitHub API comments, repository-write automation, provider execution, networked evals, replay behavior, raw content capture, or persisted schema changes;
- root/core dependency expansion or broad architecture rewrites.

## Acceptance criteria

- full release-readiness evidence is captured in `V1.8.0-RELEASE-READINESS.md`;
- validation commands and notable warnings/failures are recorded exactly enough for maintainer review;
- docs remain honest about private/unpublished packages and release gates;
- no version, tag, publish, changeset, or release action is performed.

## Focused tests

Use the release-readiness gate from the execution plan. Include at minimum:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm pack:smoke
pnpm compat:smoke
node scripts/performance-baseline.mjs
git diff --check
```

Add `npm pack --dry-run` and CLI help/package-content checks if required by the release-readiness plan.

## Proposed commit

```text
docs: prepare v1.8.0 release readiness
```

## Stop condition

Stop on unrelated worktree changes, a material validation failure that cannot be fixed without expanding scope, any decision requiring package publication/version/tag/release authority, package publish-status changes, root/core dependency expansion, hosted upload or GitHub API behavior, persisted schema changes, or raw content capture.
