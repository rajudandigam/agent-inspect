# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-6-eval-package-scaffold-and-deterministic-core"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-5-eval-package-rfc-and-boundary"
```

## Goal

Create the optional `@agent-inspect/eval` package and initial deterministic local eval core.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/EVAL-PACKAGE.md`
- `docs/proposals/TRACE-CHECKS.md`
- relevant checks/readers/package-smoke tests

## Prior chunk evidence

- Starting commit: `6eec00a0124c06a28ea38a619435d9959f89e93b`.
- Added `docs/proposals/EVAL-PACKAGE.md`.
- Defined `@agent-inspect/eval` as deterministic local eval primitives over existing readers/checks.
- Documented result schema, package boundary, CLI shape, report/artifact interaction, configuration strategy, non-goals, and no-network defaults.
- Updated proposal index.

## In scope

1. Add `packages/eval/package.json`.
2. Add ESM/CJS/types build config.
3. Add initial public API:
   - `evalRun`;
   - `checks`;
   - `EvalRunResult`;
   - deterministic Markdown summary helper.
4. Implement initial deterministic checks:
   - `requireSuccess`;
   - `requiredTools`;
   - `forbiddenTools`;
   - `maxDurationMs`;
   - `maxDepth`;
   - `maxRetries`;
   - `maxTotalTokens`;
   - `noFailedSteps`;
   - `requiredRetrievalBeforeGeneration`;
   - `requiredDecisionMetadata`.
5. Reuse existing reader/check semantics where practical; do not create a new persisted trace model.
6. Add package smoke and focused tests.

## Out of scope

- package version changes, changesets, publishing, or tags;
- CLI eval command implementation;
- grounding heuristics beyond the initial deterministic checks;
- root/core dependency additions;
- schema changes;
- LLM/provider implementation;
- hosted service or dataset platform;
- adapter implementation;
- v3 extensibility implementation.

## Focused validation

```bash
pnpm exec vitest run packages/eval/test
pnpm build
pnpm typecheck
pnpm test
pnpm pack:smoke
pnpm compat:smoke
git diff --check
```

## Acceptance criteria

- `@agent-inspect/eval` is a public optional package boundary with ESM/CJS/declaration output.
- `evalRun` produces deterministic JSON-safe results from local trace input.
- Built-in checks produce stable findings/evidence without raw payload leakage.
- Package smoke covers `@agent-inspect/eval`.
- No root/core runtime dependency, package publishing, changeset, version, schema, or network behavior is introduced.

## Proposed commit

```text
feat(eval): add deterministic local eval package
```

## Next chunk

`v2.1-7-eval-grounding-heuristics-and-cli`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, or validation failure that cannot be repaired inside eval package scope.
