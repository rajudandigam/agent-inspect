# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-11-run-tool-llm-checks"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-10-checks-subpath-and-engine"
```

## Goal

Implement the first built-in deterministic rule families for `agent-inspect/checks`: run, tool, and LLM rules covering status, duration, required/forbidden/allowed tools, ordering, failures/retries, model/provider counts, token budgets, and finish reasons.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 11
- `docs/proposals/TRACE-CHECKS.md`
- `packages/core/src/checks/`
- `packages/core/src/entries/checks.ts`
- existing checks engine tests and fixtures
- adapter conformance fixtures only if needed to confirm rule behavior over adapter-normalized events

## In scope

1. Add built-in run rules for success/status, max duration, required/forbidden errors, event counts, and depth where supported by the existing check facts.
2. Add built-in tool rules for required, forbidden, allowed tools, ordering, failure/retry bounds, and counts.
3. Add built-in LLM rules for allowed providers/models, call counts, token budgets, and finish reasons when exposed by normalized attributes.
4. Expose rule factory helpers through `agent-inspect/checks` without adding root exports.
5. Keep rule outputs deterministic, evidence-bearing, and free of raw prompt/output/tool payload capture.
6. Keep rules pure over normalized reader output; do not read files or call providers.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- CLI command/flags, config file discovery/loading, reporter implementations, baseline comparison implementation, structure/safety rules, or broad reporter work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- built-in run/tool/LLM rule factories are available from `agent-inspect/checks` with experimental TSDoc;
- rules operate on normalized `PersistedInspectEvent` and run-tree facts without reparsing files;
- failing rules include stable run/event/span evidence, expected/actual values where relevant, and deterministic messages;
- no rule emits raw prompts, outputs, request/response bodies, headers, API keys, or full tool payloads;
- no CLI/config/reporter/baseline/structure/safety implementation, new dependency, persisted schema change, provider execution, or network behavior lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/core/test/checks.test.ts packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/package-boundaries.test.ts
```

Add or split a dedicated run/tool/LLM checks test file after inspecting the final implementation shape.

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
feat: add run tool and llm checks
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into CLI/config/reporter/baseline/structure/safety implementation, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 11 scope.
