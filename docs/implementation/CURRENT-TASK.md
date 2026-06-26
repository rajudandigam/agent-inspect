# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-10-checks-subpath-and-engine"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-9-checks-rfc"
```

## Goal

Add the experimental `agent-inspect/checks` subpath and pure deterministic checks engine foundation: public types, rule execution, stable ordering, result aggregation, and no CLI coupling.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 10
- `docs/proposals/TRACE-CHECKS.md`
- `docs/proposals/TRACE-READER.md`
- `docs/proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md`
- existing reader exports, subpath entry patterns, package export tests, and API/subpath stability tests

## In scope

1. Add an experimental checks subpath following existing core entry/export patterns.
2. Add public types for checks input, rule context, rule definitions, findings, evidence, diagnostics, and aggregate result.
3. Implement pure rule execution over already-normalized reader output or provided run/event data.
4. Implement deterministic rule/finding ordering and result aggregation.
5. Add a minimal built-in foundation only if needed to validate the engine contract; keep rule-family implementation for later chunks.
6. Keep the engine free of CLI coupling, filesystem reads, config-file loading, provider execution, and network behavior.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- CLI command/flags, config file discovery/loading, reporter implementations, baseline comparison implementation, or broad rule-family implementation;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- `agent-inspect/checks` resolves for ESM, CJS, and declarations through existing package export/build/test patterns;
- exported experimental public types have TSDoc and an experimental note where public;
- engine execution is pure, deterministic, local-only, and accepts normalized data without reparsing files;
- findings include rule ID, severity, status, message, expected/actual values when relevant, and stable evidence;
- aggregation separates rule failures from execution/config/input errors without CLI exit-code coupling;
- no new runtime dependency, persisted schema, CLI behavior, provider execution, or network behavior lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/package-boundaries.test.ts
```

Add a dedicated checks engine test file and include it in the focused command after inspecting the final file name.

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
feat: add deterministic trace check engine
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into CLI/config/reporter/baseline/rule-family implementation, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 10 scope.
