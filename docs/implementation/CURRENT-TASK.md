# Current Codex Task

## Identity

```yaml
train: "v2.3.0"
chunk: "v2.3-2-openai-agents-adapter-hardening"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.3-1-ai-sdk-adapter-hardening"
```

## Goal

Harden `@agent-inspect/openai-agents` by making local-only replacement mode and additional processor mode clear, tested, and safe by default.

## Read first

- `AGENTS.md`
- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/release-trains/V2.3.0-EXECUTION-PLAN.md`
- `docs/proposals/OPENAI-AGENTS-JS-TRACING.md`
- `docs/ADAPTERS.md`
- `docs/ADAPTER-CONFORMANCE.md`
- `packages/openai-agents/src/`
- `packages/openai-agents/test/`

## Current Evidence

- v2.3 chunk 1 hardened AI SDK coverage for isolated parallel integrations and route-style local telemetry.
- OpenAI Agents is v2.3 priority 2 because the public package exists and user safety depends on clear processor mode choice.
- The documented safe default remains local-only replacement via `setTraceProcessors([agentInspectProcessor(...)])`.
- `addTraceProcessor(agentInspectProcessor(...))` remains an advanced user-owned choice because it can preserve existing/default exporters.

## In Scope

1. Clarify local-only replacement vs additional processor behavior in tests/docs.
2. Cover agents/generations/tools/handoffs/guardrails where the existing processor fixture surface supports it.
3. Preserve metadata-only defaults and no-upload behavior.
4. Keep OpenAI SDK dependency isolated to the optional package.

## Out Of Scope

- package versions, changesets, tags, releases, or publishing;
- OpenAI SDK dependency in root/core;
- silent default processor changes;
- hosted upload, vendor exporter, or provider call behavior;
- raw prompt/output/tool payload capture by default;
- schema changes;
- AI SDK/LangChain/Mastra/Nest runtime changes.

## Acceptance Criteria

- Users can choose local-only replacement vs additional mode from docs/tests without ambiguity.
- OpenAI Agents processor fixtures cover the prioritized lifecycle shapes available in local fixtures.
- No root/core dependency or package export drift is introduced.
- Existing OpenAI Agents imports remain compatible.
- Validation passes.

## Suggested Commit

```text
feat(openai-agents): harden local trace processor
```

## Focused Tests

```bash
pnpm exec vitest run packages/openai-agents/test/api-stability.test.ts packages/core/test/adapter-executable-conformance.test.ts
```

## Chunk Gate

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm pack:smoke
git diff --check
```

## Stop Condition

Stop if the OpenAI Agents integration needs a new public API, schema change, root/core dependency, default network/upload behavior, raw payload capture by default, package-version/change-set work, or validation failure outside the OpenAI Agents hardening scope.
