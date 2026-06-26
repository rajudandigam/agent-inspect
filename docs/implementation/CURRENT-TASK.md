# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-19-recipes-docs-performance"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-18-jest-integration"
```

## Goal

Add check, baseline, Vitest, Jest, safe artifact, and GitHub Actions recipes; update README/API/CLI/schema/limitations/known issues; benchmark large traces and check execution.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 19
- `docs/proposals/TRACE-CHECKS.md`
- existing docs and recipes touched by v1.8 chunks
- existing recipe validation and performance baseline scripts

## In scope

1. Add deterministic local recipes for checks, baseline regression, Vitest, Jest, safe artifacts, and GitHub Actions artifact/summary workflows.
2. Update public docs for v1.8 check, safety, artifact, and reporter workflows.
3. Benchmark large traces and check execution with existing local scripts or scoped additions.
4. Keep docs honest about private/unpublished packages and release-readiness gates.
5. Keep recipes local-first, no-network by default, and secret-free.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- new hosted upload behavior, GitHub API calls, repository-write behavior, automatic PR comments, or CI service integrations beyond local artifact/summary files;
- provider execution, API keys, network calls, replay behavior, prompt/eval hosting, pricing/provider semantics, or persisted schema changes;
- root/core runtime dependencies or broad architecture rewrites.

## Acceptance criteria

- recipes validate through the existing recipe checker or a scoped extension;
- docs describe checks, baselines, safe artifacts, Vitest, Jest, and GitHub Actions workflows without overclaiming hosted integration or package publication state;
- performance evidence is captured for large traces/check execution;
- no raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads are introduced into fixtures or docs examples;
- no GitHub API use, repository-write behavior, new root/core dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm recipes:check
pnpm fixtures:check
pnpm exec vitest run packages/core/test/recipes-smoke.test.ts packages/core/test/examples-smoke.test.ts packages/core/test/security-redaction.test.ts
node scripts/performance-baseline.mjs
```

Adjust the focused set after inspecting the final docs/recipe/performance shape.

## Chunk gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Proposed commit

```text
docs: add deterministic ci check workflows
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into GitHub API usage, repository-write behavior, hosted uploads, compliance certification, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 19 scope.
