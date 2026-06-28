# Current Codex Task

## Identity

```yaml
train: "v2.4.0"
chunk: "v2.4-3-session-aware-search-checks"
status: "pending"
executionMode: "autonomous-release-train"
dependsOn: "v2.4-2-sessions-session-cli"
```

## Goal

Add session-aware search and checks: `search --session`, session/group check input, cohort grouping.

## Read first

- `docs/proposals/SESSIONS-AND-WORKFLOW-CAUSALITY.md`
- `packages/core/src/search.ts`
- `packages/core/src/checks/`
- `packages/cli/src/search.ts`
- `packages/cli/src/check.ts`

## In Scope

1. `search --session <id>` filter runs by session.
2. Check CLI/config accepts session or group scope.
3. Cohort grouping by session/group with evidence references.
4. Tests and docs; old search behavior unchanged without flags.

## Out Of Scope

- MCP package (chunk 4);
- viewer or network behavior.

## Suggested Commit

```text
feat: add session-aware search and checks
```

## Chunk Gate

```bash
pnpm exec vitest run packages/cli/test/search.test.ts packages/cli/test/check.test.ts packages/core/test/search.test.ts packages/core/test/sessions
pnpm build
pnpm typecheck
pnpm test
pnpm fixtures:check
git diff --check
```
