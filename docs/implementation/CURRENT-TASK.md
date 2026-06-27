# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-9-release-readiness"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-8-eval-redact-recipes-and-documentation"
```

## Goal

Prepare v2.1 for maintainer release authorization, then stop before any versioning, tagging, publishing, or first public package publication gate.

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

- Starting commit: `1430ba3805bdcbae4d02cea4a85c48a9f41c4292`.
- Added v2.1 adoption docs for local eval, redaction, safe sharing, CLI usage, API surfaces, limitations, comparisons, adapters, known issues, and roadmap alignment.
- Added deterministic local recipes:
  - `examples/recipes/eval-local-checks`;
  - `examples/recipes/redact-share-safe-file`;
  - `examples/recipes/eval-ci-artifacts`.
- Updated recipe validation for 23 recipes.
- Ran the three new recipes locally with elevated runtime permissions because `tsx` IPC pipes are sandbox-blocked.

## In scope

1. Update or create v2.1 release-readiness documentation.
2. Inspect package tarballs and public/private package set.
3. Run the full release-readiness validation gate:

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

4. Draft release notes/readiness summary for maintainer review.
5. Stop before versioning or publication.

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

- Release-readiness documentation accurately summarizes v2.1 scope, validation, package set, and remaining manual gates.
- Full release-readiness gate passes or any failure is repaired inside the release-readiness scope.
- No package version, changeset, tag, publish, GitHub release, schema, dependency, or public breaking change is introduced.
- First public package publication requirements are called out for maintainer review.

## Proposed commit

```text
docs: prepare v2.1 release readiness
```

## Next step

Maintainer release authorization and manual release workflow.

## Stop condition

Stop on unrelated worktree changes, validation failures that cannot be repaired in scope, root/core dependency requirements, network/provider behavior, schema redesign, package export breaking changes, registry/credential problems, any first public package publication gate, or any publish/tag/release operation not explicitly authorized.
