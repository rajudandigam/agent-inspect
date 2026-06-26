# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-16-safe-artifacts-and-github-summary"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-15-scan-and-verify-safe"
```

## Goal

Create deterministic JSON, Markdown, HTML, check, and diff artifacts plus GitHub step-summary output. Apply safety before rendering. Do not add GitHub API calls or repository-write behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 16
- `docs/proposals/TRACE-CHECKS.md`
- existing CLI command patterns and help tests
- existing report/export/check/diff output paths
- existing redaction and safety rules
- existing reader, report, diff, check, and CLI tests/fixtures

## In scope

1. Add deterministic local artifact generation for JSON, Markdown, HTML, check, and diff outputs.
2. Add GitHub step-summary output using local environment/file behavior only.
3. Apply safety/redaction before rendering artifacts and summaries.
4. Keep artifact contents deterministic and avoid raw prompt/output/request/response/header/API key/secret leakage.
5. Reuse existing report/export/check/diff/readers where possible instead of creating a parallel rendering system.
6. Keep the implementation local, read-only, dependency-light, and no-network.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- GitHub API calls, repository-write behavior, hosted uploads, CI service integrations beyond local step-summary file output, or broad reporter framework work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- artifacts are deterministic for the same input files and options;
- artifacts are written only to explicit local paths or GitHub step-summary file paths supplied by the environment/options;
- safety/redaction happens before rendering any Markdown, HTML, summary, check, or diff artifact;
- no output emits raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- GitHub step-summary support uses no GitHub API and does not write repository state;
- no new dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/cli/test/export.test.ts packages/cli/test/report.test.ts packages/cli/test/check.test.ts packages/cli/test/diff.test.ts packages/cli/test/cli.test.ts packages/core/test/exporters/html-exporter.test.ts packages/core/test/exporters/markdown-exporter.test.ts packages/core/test/checks.test.ts packages/core/test/diff/renderer.test.ts packages/core/test/security-redaction.test.ts
```

Adjust the focused set after inspecting the final artifact and summary implementation shape.

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
feat: add safe ci trace artifacts
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into GitHub API usage, repository-write behavior, hosted uploads, compliance certification, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 16 scope.
