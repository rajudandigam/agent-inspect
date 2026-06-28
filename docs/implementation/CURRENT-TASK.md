# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-2-sessions-session-cli"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.4-1-session-aware-reader-and-index-helpers"
```

## Goal

Add `agent-inspect sessions` and `agent-inspect session` read-only CLI commands.

## Read first

- `docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md`
- `packages/core/src/sessions/`
- `packages/cli/src/` command patterns (`timeline`, `stats`, `list`)
- `docs/CLI.md`

## In Scope

1. `packages/cli/src/sessions.ts` — list sessions from trace dir.
2. `agent-inspect session <sessionId>` — view with `--timeline`, `--critical-path`, `--json`, `--diagnostics`.
3. CLI tests and `docs/CLI.md` updates.
4. Stable JSON output; no mutation.

## Out Of Scope

- search/check session flags (chunk 3);
- MCP package (chunk 4);
- viewer or network behavior.

## Suggested Commit

```text
feat: add session inspection commands
```

## Chunk Gate

```bash
pnpm exec vitest run packages/cli/test/sessions.test.ts packages/core/test/sessions
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
git diff --check
```
