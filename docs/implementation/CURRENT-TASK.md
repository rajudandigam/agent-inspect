# Current Codex Task

## Identity

```yaml
train: "v1.8.0"
chunk: "v1.8-5-openai-agents-tracing-processor"
status: "ready"
executionMode: "autonomous-release-train"
dependsOn: "v1.8-4-optional-package-tarball-smoke"
```

## Goal

Replace the private OpenAI Agents scaffold placeholder with an official local-only tracing processor that maps safe metadata into AgentInspect v0.2 persisted events.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/ROADMAP-V1.8-TO-V3.md`
- `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md` chunk 5
- `docs/proposals/OPENAI-AGENTS-JS-TRACING.md`
- `packages/openai-agents/package.json`
- `packages/openai-agents/src/index.ts`
- `packages/openai-agents/test/api-stability.test.ts`
- writer/persisted helpers only as needed for local v0.2 output

## In scope

1. Implement the official OpenAI Agents `TracingProcessor`-compatible surface in `@agent-inspect/openai-agents`.
2. Map trace/run, agent, generation, tool/function, handoff, guardrail, MCP/custom, errors, parentage, trace context, and lifecycle metadata where safely representable from processor callbacks.
3. Preserve metadata-only default capture; summarize presence/counts/lengths instead of persisting raw prompts, messages, outputs, tool arguments, hosted tool data, or arbitrary span payloads.
4. Accept a caller-provided `TraceWriter` or create a local file writer from `traceDir`; isolate write, flush, shutdown, clone, and summarization failures into diagnostics.
5. Keep installation explicit and local-only: guidance and helpers must use `setTraceProcessors()` replacement behavior, never auto-install or default to `addTraceProcessor()`.
6. Keep `@openai/agents` as an optional package peer dependency; do not add SDK dependencies to root/core.

## Out of scope

- publishing `@agent-inspect/openai-agents`, changing its `private` status, package version changes, changesets, npm publication, tags, or releases;
- provider/model execution, OpenAI API calls, default backend export, network behavior, API keys, or credentials;
- preview/full raw content capture, raw chain-of-thought capture, or weaker redaction/size protections;
- LangGraph, checks engine, recipes, or adapter conformance chunks beyond tests needed for this processor.

## Acceptance criteria

- `agentInspectProcessor(options)` returns a processor compatible with the official OpenAI Agents tracing callback shape without importing or installing global processors as a side effect;
- local v0.2 rows preserve trace/span IDs, parent IDs, span kinds, workflow/run names, timestamps/durations/status, safe model/tool names, token counts when structured, errors, and diagnostics;
- unsupported or ambiguous callback payloads are handled conservatively with warnings instead of fabricated relationships;
- `forceFlush()` and shutdown are safe, idempotent, local-only, and expose failures through diagnostics/stats;
- tests use deterministic no-network fixtures and verify no raw prompt/output/tool payload persistence by default;
- root/core package dependencies and public root exports remain unchanged.

## Focused tests

```bash
pnpm exec vitest run packages/openai-agents/test/api-stability.test.ts packages/core/test/writers/index.test.ts packages/core/test/persisted/to-trace-event.test.ts packages/core/test/persisted/from-trace-event.test.ts
pnpm pack:smoke
```

Adjust the exact file list after inspecting callback shapes and writer helpers, but keep it focused on the OpenAI Agents processor boundary and package smoke behavior.

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
feat: add local openai agents trace processor
```

## Stop condition

Stop on unrelated worktree changes, material conflict with the v1.8 plan or OpenAI Agents tracing RFC, official SDK API uncertainty that requires live documentation re-verification, root/core dependency pressure, publication/versioning decisions, upload/default-backend ambiguity, raw content capture requirements, or validation failures that cannot be fixed within chunk 5 scope.
