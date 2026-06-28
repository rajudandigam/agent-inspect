# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-4-mcp-telemetry-package"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.4-3-session-aware-search-checks"
```

## Goal

Add `@agent-inspect/mcp` local MCP client tool-call tracing (telemetry only).

## Read first

- `docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md` §10
- `docs/implementation/release-trains/V2.4.0-EXECUTION-PLAN.md` chunk 4
- Existing optional package patterns (`packages/redact`, `packages/eval`)

## In Scope

1. `packages/mcp/` package scaffold with client wrap for tools/list and tools/call.
2. Bounded summaries, duration, errors, session metadata on tool spans.
3. Tests, recipe, tsup config.

## Out Of Scope

- MCP server/gateway
- Root/core new deps

## Suggested Commit

```text
feat(mcp): add local MCP tool-call tracing
```

## Chunk Gate

```bash
pnpm exec vitest run packages/mcp/test
pnpm build
pnpm typecheck
pnpm test
git diff --check
```
