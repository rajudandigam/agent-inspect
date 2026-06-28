# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-release-prep"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-6-adapter-docs-and-release-readiness"
```

## Goal

Prepare the standard Changesets release workflow for the v2.3.0 linked minor release.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.3.0-RELEASE-READINESS.md`
- `.changeset/config.json`
- `CHANGELOG.md`
- root and public optional package manifests

## Current Evidence

- v2.3 readiness passed locally at commit `06646dc4870593805eff96c39b433c7e7fc31372` plus readiness docs edits.
- npm registry currently reports `latest: 2.2.0` for all nine public packages.
- `.changeset/config.json` links the nine public packages and ignores only private/internal packages plus examples/recipes.
- The maintainer authorized continuing the release workflow for minor releases.

## In Scope

1. Add a Changesets markdown file for a linked minor `2.3.0` release of the nine public packages.
2. Verify `changeset status --verbose` shows exactly nine minor releases and no patch/major releases.
3. Run the release-prep validation gate.
4. Commit and push the release-prep changes to `main`.
5. Wait for the standard Changesets Version Packages PR, inspect it, merge only if checks are green and the diff is exactly expected, then watch publish and verify npm/tags/releases.

## Out Of Scope

- hand-editing package versions or changelog release sections outside Changesets automation;
- local `npm publish` or `pnpm publish`;
- manual tags or GitHub releases;
- new adapter implementation or package;
- new root/core dependencies;
- hosted upload, provider calls, network behavior, schema changes, or public breaking changes;
- Mastra/Nest implementation.

## Acceptance Criteria

- Changesets status shows exactly the intended linked v2.3 minor release set.
- Release-prep validation passes.
- Remote CI/Publish checks pass for the release-prep commit.
- Any Version Packages PR is reviewed for expected linked `2.3.0` bumps before merge.
- Validation passes.

## Suggested Commit

```text
chore: prepare v2.3 release
```

## Focused Tests

```bash
pnpm exec changeset status --verbose
pnpm pack:smoke
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

Stop if Changesets status shows any patch/major release, the linked public package set is wrong, validation fails and cannot be repaired inside release-prep scope, the Version Packages PR diff is not exactly expected, required CI fails, publication is partial, credentials/trusted publishing are missing, or any manual maintainer decision is required.
