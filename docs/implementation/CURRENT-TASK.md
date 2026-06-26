# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-12-structure-and-safety-rules"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-11-run-tool-llm-checks"
```

## Goal

Implement the next built-in deterministic rule families for `agent-inspect/checks`: structure and safety rules covering incomplete/orphan/cycle/relationship/parallel-width/retrieval/guardrail/decision signals plus deterministic redaction, prompt/output, sensitive-pattern, and oversized-attribute checks.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 12
- `docs/proposals/TRACE-CHECKS.md`
- `packages/core/src/checks/`
- `packages/core/src/entries/checks.ts`
- existing checks engine tests and fixtures
- reader and adapter conformance fixtures only if needed to confirm structure/safety signals over normalized events

## In scope

1. Add built-in structure rules for incomplete spans/events, orphan relationships, cycles, relationship consistency, and parallel-width bounds where supported by existing check facts.
2. Add built-in retrieval, guardrail, and decision signal rules when those signals are present in normalized event metadata.
3. Add built-in safety rules for redaction markers, raw prompt/output indicators, sensitive string patterns, and oversized attributes without emitting sensitive values.
4. Expose rule factory helpers through `agent-inspect/checks` without adding root exports.
5. Keep rule outputs deterministic, evidence-bearing, and free of raw prompt/output/tool payload capture.
6. Keep rules pure over normalized reader output; do not read files or call providers.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- CLI command/flags, config file discovery/loading, reporter implementations, baseline comparison implementation, or broad reporter work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- built-in structure/safety rule factories are available from `agent-inspect/checks` with experimental TSDoc;
- rules operate on normalized `PersistedInspectEvent` and run-tree facts without reparsing files;
- failing rules include stable run/event/span evidence, expected/actual values where relevant, and deterministic messages;
- safety findings identify matched policy/type/path without emitting raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- no CLI/config/reporter/baseline implementation, new dependency, persisted schema change, provider execution, or network behavior lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/core/test/checks.test.ts packages/core/test/subpath-exports.test.ts packages/core/test/package-exports-compat.test.ts packages/core/test/package-boundaries.test.ts
```

Add or split a dedicated structure/safety checks test file after inspecting the final implementation shape.

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
feat: add structure and safety checks
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into CLI/config/reporter/baseline implementation, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 12 scope.
