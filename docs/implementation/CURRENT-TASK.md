# Current Codex Task

## Identity

```yaml
train: "v2.0.0"
chunk: "v2.0-release-prep-and-publication"
status: "validated_pending_commit"
executionMode: "autonomous-release-train"
dependsOn: "v2.0-7-release-readiness"
```

## Goal

Prepare and run the v2.0.0 release workflow through the existing Changesets/GitHub automation after maintainer authorization.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.0.0-EXECUTION-PLAN.md`
- `docs/implementation/release-trains/V2.0.0-RELEASE-READINESS.md`
- `.changeset/config.json`
- `.github/workflows/publish.yml`

## In scope

1. Add a single linked v2.0.0 Changesets release-prep file for the existing public linked release set.
2. Validate Changesets status and standard release-prep gates.
3. Commit and push release-prep changes to `main`.
4. Wait for the Version Packages PR, verify it only performs the expected linked v2.0.0 bumps, and merge only after checks are green.
5. Watch the publish workflow, verify npm versions, tags, and GitHub releases, then update readiness/state/task records.

## Out of scope

- source/runtime/schema behavior changes;
- package export route changes;
- hand-edited package version changes, force pushes, branch deletion, or unrelated release artifacts;
- new dependencies;
- hosted upload, provider/network, replay, or cost-engine behavior.

## Focused validation

```bash
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
pnpm compat:smoke
pnpm exec changeset status --verbose
git diff --check
```

## Acceptance criteria

- Changesets status reports exactly the linked public package set planned for v2.0.0.
- Standard release-prep validation passes locally.
- Version Packages PR contains only expected package/changelog/lockfile changes.
- Publish workflow completes, or stops at the first failure for maintainer confirmation.
- No package export routes, dependencies, hosted upload, provider/network, replay, or cost-engine behavior changes.

## Completion evidence

- Starting commit: `c63ca0707c636bc8b072fadda44307fa03cff341`.
- Maintainer authorized v2 release workflow after chunk 7 remote CI/Publish passed.
- Added `.changeset/bright-walls-inspect.md` for a linked major v2.0.0 release of `agent-inspect`, `@agent-inspect/langchain`, `@agent-inspect/tui`, `@agent-inspect/ai-sdk`, and `@agent-inspect/openai-agents`.
- `CI=true pnpm exec changeset status --verbose` passed.
  - No patch or minor packages; exactly the five linked public packages planned for major `2.0.0`.
- `CI=true pnpm test:all` passed.
  - Re-ran typecheck, test, build, and size; test phase passed 124 files / 1101 tests; size 11.31 kB.
- `CI=true pnpm fixtures:check` passed.
  - 9 v0.1 JSONL files, 6 v0.2 JSONL files, 5 v1.0 JSONL files, 8 logs, 5 configs.
- `CI=true pnpm recipes:check` passed.
  - 20 recipes validated.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm pack:smoke` passed.
  - Tarball install, ESM import, CJS require, CLI 1.9.0, optional package installs, and local bin / npm exec / npx help.
- `CI=true npm_config_cache=/private/tmp/agent-inspect-npm-cache pnpm compat:smoke` passed.
  - Bundled CJS, ESM/CJS consumers, subpath ESM/CJS, Jest-style CJS pattern, ts-jest Node16 compile, CLI help.
- `git diff --check` passed.

## Proposed commit

```text
chore: prepare v2 release
```

## Next chunk

Version Packages PR verification and publish workflow.

## Stop condition

Stop immediately on unrelated worktree changes, validation failures that cannot be repaired in scope, missing credentials, CI failure, material plan drift, unexpected Version Packages PR contents, partial publication, or any decision requiring schema redesign, dependency changes, package export routes, hosted upload, provider/network, replay, or cost-engine behavior.

Known risk: `@agent-inspect/openai-agents` still showed npm registry version `1.8.0` during readiness while local manifests were `1.9.0`; if npm Trusted Publishing is not enabled for that package, the publish workflow may fail there and require maintainer action.
