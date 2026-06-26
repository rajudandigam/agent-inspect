# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-18-jest-integration"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-17-vitest-integration"
```

## Goal

Add independent optional `@agent-inspect/jest` behavior and compatibility tests without assuming Jest and Vitest lifecycles are identical.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 18
- `docs/proposals/TRACE-CHECKS.md`
- Jest reporter APIs from local installed dependency/docs if present
- package export/build patterns for optional packages
- `packages/vitest` for safety goals only, not lifecycle assumptions
- existing writer/runtime safety rules
- existing artifact generation and safety/redaction paths
- existing package smoke, consumer, and API stability tests

## In scope

1. Add an optional `@agent-inspect/jest` package using package-local exports and dependencies.
2. Associate Jest test results with trace files explicitly, without timestamp guessing.
3. Generate safe failure artifacts with structural output only.
4. Preserve original Jest failures even when reporter/artifact work fails.
5. Support configurable successful-trace retention with bounded output.
6. Keep the implementation local-first, dependency-light, and no-network.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- rewriting the Vitest package into a generic reporter framework;
- GitHub API calls, repository-write behavior, hosted uploads, or CI service integrations beyond local artifact/summary file output;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- root/core runtime dependencies, pricing/provider semantics, or persisted schema changes.

## Acceptance criteria

- Jest integration is optional and does not add dependencies to root/core runtime;
- test-to-trace association is explicit and deterministic;
- failure artifacts avoid raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- reporter/artifact errors do not replace or hide original Jest failures;
- successful-trace retention is configurable and bounded;
- implementation respects Jest lifecycle semantics independently from Vitest;
- no GitHub API use, repository-write behavior, new root/core dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/jest/test packages/core/test/package-smoke.test.ts packages/core/test/package-boundaries.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/security-redaction.test.ts
```

Adjust the focused set after inspecting the final Jest integration shape.

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
feat: add jest trace reporter
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into GitHub API usage, repository-write behavior, hosted uploads, compliance certification, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 18 scope.
