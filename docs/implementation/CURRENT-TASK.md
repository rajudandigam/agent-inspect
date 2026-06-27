# Current Codex Task

## Identity

```yaml
train: "v2.1.0"
chunk: "v2.1-7-eval-grounding-heuristics-and-cli"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v2.1-6-eval-package-scaffold-and-deterministic-core"
```

## Goal

Make eval useful for local RAG/agent behavior with deterministic grounding heuristics and a root CLI workflow, without LLM judging or provider calls.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3.md`
- `docs/implementation/ROADMAP-V2.1-TO-V3-FULL.md`
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- `docs/implementation/release-trains/V2.1.0-EXECUTION-PLAN.md`
- `docs/proposals/EVAL-PACKAGE.md`
- `packages/eval/src/index.ts`
- `packages/eval/test/index.test.ts`
- relevant CLI command patterns

## Prior chunk evidence

- Starting commit: `637f36fcd796f56f4756f8272babe954457c8148`.
- Added public optional workspace package `@agent-inspect/eval`.
- Added ESM/CJS/declaration build via `tsup.eval.config.ts`.
- Added initial public API: `evalRun`, `checks`, `EvalRunResult`, `EvalRunInput`, and `renderEvalMarkdown`.
- Added deterministic local checks for success, tools, duration, depth, retry count, token count, failed steps, retrieval-before-generation, and decision metadata.
- Added package smoke and package-boundary coverage.
- Updated the lockfile for the new workspace package.

## In scope

1. Add deterministic grounding heuristics:
   - context overlap;
   - quote overlap;
   - citation presence;
   - required source IDs;
   - answer length bounds;
   - banned unsupported phrases.
2. Add root CLI workflow:
   - `agent-inspect eval trace.jsonl --config agent-inspect.eval.ts` only if an explicit supported loader path exists;
   - `agent-inspect eval trace.jsonl --require-success`;
   - `agent-inspect eval trace.jsonl --forbid-tool deleteAccount`.
3. Support deterministic JSON output, Markdown output, failed eval exit code, unreadable input diagnostics, and no-network behavior.
4. Keep source traces read-only and non-mutating.

## Out of scope

- package version changes, changesets, publishing, or tags;
- LLM/provider judging;
- TypeScript config loader dependency;
- root/core dependency additions;
- schema changes;
- hosted service or dataset platform;
- adapter implementation;
- v3 extensibility implementation.

## Focused validation

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
git diff --check
```

## Acceptance criteria

- Grounding checks are deterministic, local-only, and evidence-rich.
- CLI eval produces stable JSON and Markdown output.
- CLI failures use deterministic exit codes.
- No model/provider/network behavior is introduced.
- No package publishing, changeset, version, schema, or root/core dependency change is introduced.

## Proposed commit

```text
feat: add local eval CLI
```

## Next chunk

`v2.1-8-eval-redact-recipes-and-documentation`.

## Stop condition

Stop on unrelated worktree changes, root/core dependency decisions, schema decisions, package publication gates, network behavior, public breaking changes, TypeScript config loader decisions, or validation failure that cannot be repaired inside eval CLI scope.
