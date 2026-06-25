# Current Codex Task

## Identity

```yaml
train: "v1.6.0"
chunk: "v1.6.0-release-preparation"
status: "ready"
dependsOn: "14-release-readiness"
```

## Goal

Prepare exactly v1.6.0 release metadata after the release-readiness gate has passed.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V1.6.0-RELEASE-READINESS.md`
- package manifests, changelog, release metadata, and directly related validation scripts only

## In scope

1. Update package versions consistently to `1.6.0` according to the repository release process.
2. Create or update changeset/version metadata only if the existing repository process requires it for a release-preparation commit.
3. Convert `CHANGELOG.md` Unreleased v1.6.0 entries into a `1.6.0` release heading dated 2026-06-25.
4. Update README/current-release references that should say 1.6.0 after version preparation.
5. Run the full release gate again.
6. Update release-train state and readiness notes with release-preparation evidence.

## Out of scope

- npm publish unless credentials/process are available and validation is fully green
- git tag or GitHub release unless the repository process and credentials are available and safe
- new runtime, reader, writer, CLI, or schema behavior
- new dependencies
- changing Node support policy
- any version other than exactly `1.6.0`

## Acceptance criteria

- Package metadata, changelog, and user-facing current-version docs consistently reflect `1.6.0`.
- Full release gate passes after version preparation.
- No publish, tag, or GitHub release occurs unless explicitly safe under the repository process.
- Release-train state reflects whether release preparation is complete and whether publish was skipped.

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
chore: prepare v1.6.0 release
```

## Stop condition

Stop after release-preparation validation, state updates, commit, and push if npm publish, tagging, or GitHub release creation is unavailable or unsafe. Do not publish without fully green validation and safe credentials/process.
