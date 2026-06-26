# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-14-baseline-regression"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-13-check-cli-and-configuration"
```

## Goal

Add structural baseline regression checks for deterministic comparison of normalized candidate and baseline traces: tree divergence, tools, LLMs, models/providers, tokens, duration, retries, status, error paths, retrieval, and guardrails. Ignore nondeterministic text by default.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 14
- `docs/proposals/TRACE-CHECKS.md`
- `packages/core/src/checks/`
- `packages/core/src/entries/checks.ts`
- existing checks, diff/comparable, reader, and baseline-related tests/fixtures
- CLI check implementation only if baseline selection needs API plumbing

## In scope

1. Add baseline comparison rule support through `agent-inspect/checks` without introducing a new persisted model.
2. Compare candidate and baseline after both are normalized through reader output.
3. Cover structural dimensions from the plan: tree shape, tools, LLMs, models/providers, tokens, duration, retries, status, error paths, retrieval, and guardrails.
4. Exclude nondeterministic prompt/output/raw text differences by default.
5. Emit deterministic, evidence-bearing findings with stable expected/actual summaries and no raw payload leakage.
6. Keep the implementation local, read-only, dependency-light, and no-network.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or package publish-status changes;
- reporter artifact generation, GitHub step-summary output, scan/verify-safe commands, or broad reporter work;
- YAML config, provider execution, API keys, network calls, hosted telemetry/export, replay behavior, or prompt/eval hosting;
- new framework adapter packages, pricing/provider semantics, root/core runtime dependencies, or persisted schema changes.

## Acceptance criteria

- baseline checks compare normalized check facts rather than raw files or ad hoc parsing;
- findings are deterministic and identify relevant runs/events/spans/paths without emitting raw prompts, outputs, request/response bodies, headers, API keys, secrets, or full tool payloads;
- duration comparison uses an explicit tolerance or documented default;
- baseline and candidate format mismatches are handled conservatively after both normalize successfully;
- no reporter artifacts, scan/verify-safe command, new dependency, persisted schema change, provider execution, network behavior, hosted upload, release/tag/version/change changes, or raw content capture lands in this chunk.

## Focused tests

```bash
pnpm exec vitest run packages/core/test/checks.test.ts packages/core/test/diff/comparable.test.ts packages/core/test/readers.test.ts packages/core/test/package-boundaries.test.ts
```

Adjust the focused set after inspecting the final baseline implementation shape.

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
feat: add baseline trace regression checks
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan, any decision that expands into reporter artifact generation, scan/verify-safe commands, GitHub integration, root/core dependency expansion, package publication semantics, YAML/config dependency requirements, raw content capture requirements, persisted schema changes, or validation failures that cannot be fixed within chunk 14 scope.
