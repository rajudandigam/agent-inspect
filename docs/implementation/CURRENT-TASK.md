# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-release-authorization-manual-gate"
status: "manual-gate"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-9-release-readiness"
```

## Goal

Hold for maintainer release authorization after v2.1 release-readiness validation. Do not start versioning, tagging, publishing, GitHub releases, or first public package publication until explicitly authorized.

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
- Verified `@agent-inspect/redact` and `@agent-inspect/eval` return npm 404 and therefore require first-publication setup before v2.1 publication.
- Full local release-readiness gate passed.

## In scope

1. Maintainer reviews v2.1 readiness evidence.
2. Maintainer confirms npm package/Trusted Publishing setup for:
   - `@agent-inspect/redact`;
   - `@agent-inspect/eval`.
3. Maintainer explicitly authorizes the v2.1 minor release workflow.

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

- package version changes;
- changesets;
- tags;
- publishing;
- GitHub releases;
- npm publish or local package publication;
- runtime source changes unless needed to repair release-readiness validation;
- schema changes;
- dependency additions;
- live model/provider/network behavior beyond validation, git, npm registry metadata, and CI checks.

## Acceptance criteria

- Maintainer confirms the manual gate is satisfied.
- No package version, changeset, tag, publish, GitHub release, schema, dependency, or public breaking change is introduced before explicit release authorization.
- First public package publication requirements are satisfied for `@agent-inspect/redact` and `@agent-inspect/eval`.

## Proposed release-readiness commit

```text
docs: prepare v2.1 release readiness
```

## Next step

After explicit maintainer authorization, prepare the v2.1 minor release workflow using Changesets. Do not create patch releases.

## Stop condition

Stop on unrelated worktree changes, validation failures that cannot be repaired in scope, root/core dependency requirements, network/provider behavior, schema redesign, package export breaking changes, registry/credential problems, missing first-publication setup, or any publish/tag/release operation not explicitly authorized.
