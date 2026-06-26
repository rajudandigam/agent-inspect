# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-17-vitest-integration"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-16-safe-artifacts-and-github-summary"
```

## Goal

Add optional `@agent-inspect/vitest` with explicit test-to-trace association, failure artifacts, configurable successful-trace retention, and original-failure preservation.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 17
- `docs/proposals/TRACE-CHECKS.md`
- Vitest reporter/plugin APIs from local installed dependency/docs already in the repo
- package export/build patterns for optional adapter packages
- existing writer/runtime safety rules
- existing artifact generation and safety/redaction paths
- existing package smoke, consumer, and API stability tests

## In scope

1. Add an optional `@agent-inspect/vitest` package using package-local exports and dependencies.
2. Associate Vitest test results with trace files explicitly, without timestamp guessing.
3. Generate failure artifacts through the existing safe artifact path.
4. Preserve original Vitest failures even when reporter/artifact work fails.
5. Support configurable successful-trace retention.
6. Keep the implementation local-first, dependency-light, and no-network.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- Jest integration, broad reporter framework work, GitHub API calls, repository-write behavior, hosted uploads, or CI service integrations beyond local artifact/summary file output;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- root/core runtime dependencies, pricing/provider semantics, or persisted schema changes.

## Acceptance criteria

- Vitest integration is optional and does not add dependencies to root/core runtime;
- test-to-trace association is explicit and deterministic;
- failure artifacts use safe rendering and avoid raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- reporter/artifact errors do not replace or hide original test failures;
- successful-trace retention is configurable and bounded;
- no Jest integration, GitHub API use, repository-write behavior, new root/core dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/vitest/test packages/core/test/package-smoke.test.ts packages/core/test/package-boundaries.test.ts packages/core/test/security-redaction.test.ts
```

Adjust the focused set after inspecting the final Vitest integration shape.

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
feat: add vitest trace reporter
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into Jest integration, GitHub API usage, repository-write behavior, hosted uploads, compliance certification, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 17 scope.
