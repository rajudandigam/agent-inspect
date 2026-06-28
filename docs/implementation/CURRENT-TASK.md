# Current Codex Task

## Identity

```yaml
train: "v2.2.0"
chunk: "v2.2-4-ci-summary-command-and-recipes"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.2-3-public-jest-reporter"
```

## Goal

Add a local `agent-inspect ci-summary` workflow that can read reporter artifact manifests and write deterministic CI-safe summaries without uploading artifacts or calling hosted APIs.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.2.0-EXECUTION-PLAN.md`
- `docs/proposals/CI-REPORTERS.md`
- `packages/core/src/reporters/index.ts`
- `packages/cli/src/index.ts`
- relevant CLI tests and recipe validation scripts

## Prior chunk evidence

- Vitest and Jest reporters now write shared `0.1` artifact manifests through `agent-inspect/reporters`.
- Failed associated tests produce deterministic local report/summary artifact paths.
- Successful tests remain quiet by default, even when trace metadata is present.
- Reporter write failures remain diagnostics and do not throw through runner hooks.
- `@agent-inspect/vitest` and `@agent-inspect/jest` remain private pending maintainer first-publication setup before v2.2 release.

## In Scope

1. Add a CLI `ci-summary` command that reads local reporter artifact manifest files.
2. Support deterministic Markdown output suitable for `$GITHUB_STEP_SUMMARY`.
3. Support deterministic JSON output for downstream local tooling if the existing CLI pattern supports it cleanly.
4. Keep artifact links relative and safe.
5. Add documentation and a GitHub Actions artifact recipe.
6. Add focused CLI tests and recipe validation coverage.

## Out Of Scope

- GitHub API comments/checks;
- OAuth or GitHub App behavior;
- artifact upload by AgentInspect;
- network calls;
- reporter package publication;
- changesets;
- tags;
- package versions;
- root/core framework dependencies;
- schema changes to persisted traces.

## Acceptance Criteria

- `agent-inspect ci-summary` summarizes local reporter manifests deterministically.
- Markdown output is safe for CI step summaries and does not embed trace contents.
- JSON mode is stable if implemented.
- The recipe relies on the user's CI artifact upload mechanism, not AgentInspect uploads.
- Invalid or unsafe manifest paths fail conservatively with actionable messages.
- No new network behavior or root/core dependencies are introduced.

## Suggested Commit

```text
feat: add CI summary workflow
```

## Focused Tests

```bash
pnpm exec vitest run packages/cli/test
pnpm recipes:check
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm fixtures:check
pnpm recipes:check
pnpm pack:smoke
git diff --check
```

Add `pnpm compat:smoke` if exports/package boundaries change.

## Stop Condition

Stop on unrelated worktree changes, hosted/network behavior requests, GitHub API write requirements, schema changes, reporter package publication decisions, root/core dependency requirements, or validation failures that cannot be repaired in this chunk.
