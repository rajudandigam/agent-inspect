# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "14-release-readiness"
status: "ready"
dependsOn: "13-recipes-and-documentation"
```

## Goal

Prepare v1.6.0 release-readiness evidence and user-facing documentation updates without publishing.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-EXECUTION-PLAN.md` — chunk 14 only
- directly related README/API/CLI/schema/limitations/known-issues/changelog/package/export docs and tests only

## In scope

1. Create or update `docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md` with exact validation evidence.
2. Update README/API/CLI/schema/limitations/known-issues documentation as needed for v1.6.0.
3. Update Unreleased changelog entries for v1.6.0 readiness without converting them to released notes unless explicitly authorized during release preparation.
4. Verify package/export matrix documentation for the v1.6.0 public and experimental subpaths.
5. Capture performance and size evidence from the required validation commands.
6. Update release-train state when validation is complete.

## Out of scope

- Implementing new runtime, reader, writer, CLI, or schema behavior
- Public schema breaking changes
- new root/core dependencies
- network upload behavior or hosted ingestion
- changing Node support policy
- publishing to npm
- tagging or creating a GitHub release
- version changes or changesets until release-readiness validation is green and the release-preparation step is explicitly reached

## Acceptance criteria

- Release-readiness evidence lists exact commands and outcomes.
- User-facing docs accurately describe v1.6.0 local runtime, reader, writer, and CLI capabilities.
- Package/export matrix matches manifests and built subpaths.
- Validation is green or any blocker is documented without committing unsafe release changes.
- No npm publish, tag, GitHub release, or version/change metadata is created during readiness documentation.

## Full gate

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
pnpm perf:baseline
npm pack --dry-run
git diff --check
```

## Proposed commit

```text
docs: prepare v1.6.0 release readiness
```

## Stop condition

Stop after chunk 14 release-readiness documentation, validation, state/task updates, commit, and push if release-preparation requires version changes, changesets, tags, or publishing credentials. Do not publish unless the repository release process is available, validation is fully green, and publishing is safe.
