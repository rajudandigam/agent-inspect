# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-6-openai-agents-safety-and-recipes"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-5-openai-agents-tracing-processor"
```

## Goal

Add deterministic no-network OpenAI Agents safety fixtures and local-only recipes that teach the safe replacement install path without enabling default upload behavior.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 6
- `docs/proposals/OPENAI-AGENTS-JS-TRACING.md`
- `packages/openai-agents/src/index.ts`
- `packages/openai-agents/test/api-stability.test.ts`
- existing recipe structure and recipe validator

## In scope

1. Add no-network fixtures or tests that exercise the OpenAI Agents processor through deterministic local processor calls, not provider/model execution.
2. Add local-only recipe documentation/code showing `setTraceProcessors([agentInspectProcessor(...)])` replacement behavior.
3. Add advanced/additional-processor documentation only with an explicit warning that `addTraceProcessor()` preserves existing/default processors.
4. Cover sensitive-data exclusion, metadata-only summaries, writer failure isolation, `forceFlush()`, and shutdown behavior.
5. Keep the package private and dependency-isolated; do not publish or change versions.

## Out of scope

- package version changes, changesets, npm publication, tags, releases, or changing `@agent-inspect/openai-agents` private status;
- provider/model execution, OpenAI API calls, API keys, credentials, or default backend export;
- preview/full raw content capture, raw chain-of-thought capture, or weaker redaction/size protections;
- LangGraph, checks engine, reporter packages, or broader adapter conformance chunks.

## Acceptance criteria

- fixtures/recipes are deterministic, local-only, and require no network, provider credentials, or OpenAI account;
- replacement examples use `setTraceProcessors([agentInspectProcessor(...)])` and explain why `addTraceProcessor()` is not the default safe path;
- additional-processor examples, if added, are explicitly advanced and user-owned;
- tests prove raw prompt/output/tool/custom data and trace exporter credentials are not persisted by default;
- writer failure, flush, and shutdown behavior remains isolated and diagnostic-rich;
- docs do not claim public npm availability before the manual first-publication gate.

## Focused tests

```bash
pnpm exec vitest run packages/openai-agents/test/api-stability.test.ts packages/core/test/recipes-smoke.test.ts
pnpm recipes:check
```

Adjust the exact file list after inspecting recipe conventions, but keep it focused on OpenAI Agents no-network fixtures and recipe validation.

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
docs: add openai agents local tracing recipes
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan or OpenAI Agents tracing RFC, any fixture requiring network/provider credentials/default backend export, package publication semantics, raw content capture requirements, or validation failures that cannot be fixed within chunk 6 scope.
