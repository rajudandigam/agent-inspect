# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-13-check-cli-and-configuration"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-12-structure-and-safety-rules"
```

## Goal

Add the local `agent-inspect check` command and minimal configuration path for deterministic trace checks using canonical readers, JSON output, explicit format, stable exit codes, inline flags, JSON config, and approved JavaScript/TypeScript config behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 13
- `docs/proposals/TRACE-CHECKS.md`
- `packages/core/src/checks/`
- `packages/core/src/entries/checks.ts`
- `packages/cli/src/`
- existing CLI tests, reader tests, and checks tests
- built CLI help/smoke fixtures where relevant

## In scope

1. Add `agent-inspect check <trace-path-or-run-id>` using canonical local readers and explicit `--format` support.
2. Add deterministic JSON output for check results and stable exit-code mapping: 0 pass, 1 rule failure, 2 invalid arguments/config, 3 unreadable trace, 4 unsupported/ambiguous format.
3. Add inline flags for selecting rules and common built-in rule options where they can be normalized without broad config complexity.
4. Add JSON config loading and approved JavaScript config behavior; TypeScript config must follow the RFC-approved Node >=20 strategy or fail clearly.
5. Test the built CLI behavior, not only command handlers.
6. Preserve local, read-only, no-network behavior and avoid mutating traces.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- baseline comparison implementation, reporter artifact generation, GitHub step-summary output, or broad reporter work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- `agent-inspect check` reads traces through the canonical reader path and can produce deterministic JSON;
- exit codes match the TRACE-CHECKS RFC for pass, rule failure, invalid args/config, unreadable input, and unsupported/ambiguous input;
- built CLI tests cover successful checks, failing rules, invalid config/arguments, unreadable input, unsupported format, explicit format, and built help where relevant;
- config behavior matches the RFC boundary, including no YAML support and no implicit TypeScript loader dependency;
- no baseline implementation, new dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/cli/test/cli.test.ts packages/cli/test/check.test.ts packages/core/test/checks.test.ts packages/core/test/readers.test.ts packages/core/test/package-boundaries.test.ts
```

Adjust the focused set after inspecting the current CLI test layout; include built CLI help/smoke coverage where the command wiring requires it.

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
feat: add trace check command
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into baseline implementation, reporter artifact generation, GitHub integration, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 13 scope.
