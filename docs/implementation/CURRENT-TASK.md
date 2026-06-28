# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-version-packages-pr"
status: "release-prep"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-9-release-readiness"
```

## Goal

Prepare the v2.1 minor release through Changesets, then verify and merge the generated Version Packages PR after required checks are green.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/REDACT-PACKAGE.md`
- `docs/proposals/EVAL-PACKAGE.md`
- relevant release-readiness, package, and validation scripts

## Prior chunk evidence

- Starting commit: `665f6f9ec2cd4ce191e4c3068f61016c8cd8ded1`.
- Prepared [release-trains/V2.1.0-RELEASE-READINESS.md](./release-trains/V2.1.0-RELEASE-READINESS.md).
- Aligned `.changeset/config.json` so `@agent-inspect/redact` and `@agent-inspect/eval` are linked with the public release set, and the new private recipe packages are ignored.
- Verified existing public packages are published at `2.0.0`.
- Verified `@agent-inspect/redact` and `@agent-inspect/eval` are now published at `2.0.0` with `bootstrap` and `latest` dist-tags after maintainer first-publication setup.
- Full local release-readiness gate passed.
- Added `.changeset/violet-tools-inspect.md` for a linked minor v2.1.0 release of all public packages.

## In scope

1. Push the v2.1 release-prep changeset to `main`.
2. Wait for the GitHub Actions release workflow to create the Changesets Version Packages PR.
3. Verify the Version Packages PR contains only expected linked minor bumps and changelog updates for:
   - `agent-inspect`;
   - `@agent-inspect/ai-sdk`;
   - `@agent-inspect/langchain`;
   - `@agent-inspect/openai-agents`;
   - `@agent-inspect/tui`;
   - `@agent-inspect/redact`;
   - `@agent-inspect/eval`.
4. Merge the Version Packages PR only after required checks are green.
5. Watch the publish workflow and verify npm versions, dist-tags, tags, and GitHub releases.

## Completed release-readiness gate

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
npm pack --dry-run
git diff --check
```

## Out of scope

- manual package version changes outside the Version Packages PR;
- manually authored package changelog/version edits;
- manual tags;
- local npm publishing;
- manual GitHub releases;
- npm publish or local package publication;
- runtime source changes unless needed to repair release-readiness validation;
- schema changes;
- dependency additions;
- live model/provider/network behavior beyond validation, git, npm registry metadata, and CI checks.

## Acceptance criteria

- The release-prep Changeset plans only minor releases for the seven linked public packages.
- The Version Packages PR contains only expected v2.1.0 linked minor version/changelog changes.
- CI and Publish workflows are green at each release step.
- No schema, dependency, runtime source, or public breaking change is introduced.

## Proposed release-prep commit

```text
chore: prepare v2.1 release
```

## Next step

Push release prep, wait for the Version Packages PR, then verify and merge it after checks pass.

## Stop condition

Stop on unrelated worktree changes, validation failures that cannot be repaired in scope, root/core dependency requirements, network/provider behavior, schema redesign, package export breaking changes, registry/credential problems, partial publication, or any publish/tag/release operation not performed by the standard Changesets/GitHub release workflow.
