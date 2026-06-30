# Add log ingest config cookbook (v3)

**Labels:** `good first issue`, `documentation`, `logging`

**Difficulty:** Good first issue

**Milestone:** Examples and Fixtures

## Problem

[docs/LOGGING-PLAYBOOK.md](../../docs/LOGGING-PLAYBOOK.md) and logging recipes cover individual frameworks, but contributors need a **single cookbook** for `agent-inspect.logs.json` field mapping patterns (JSON first-class, log4js best-effort) across pino, log4js, NestJS, and Winston.

## Why it matters

Log-to-tree adoption depends on copy-pasteable config patterns without reading the entire monorepo.

## Proposed scope

- Add `docs/LOG-INGEST-COOKBOOK.md` (or extend playbook) with side-by-side config snippets for each shipped recipe.
- Document required fields (`runIdKeys`, `eventKey`, `timestampKey`) and conservative `redact` defaults.
- Link recipes: `pino-json-logs`, `log4js-json-layout`, `nestjs-json-logging`, `winston-json-logs`, `proactive-agent-logs`.
- Include sample CLI commands for `logs` and `tail`.

## Out of scope

- New log parsers or runtime ingest behavior.
- Winston/pino as core dependencies.

## Suggested files

- `docs/LOG-INGEST-COOKBOOK.md` (new)
- `docs/LOGGING-PLAYBOOK.md` (link)
- `docs/README.md` (index link)

## Acceptance criteria

- [ ] All four+ framework recipes linked with config highlights
- [ ] JSON vs log4js boundaries stated
- [ ] No vendor upload steps
- [ ] `pnpm typecheck` and `pnpm test` pass

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment before opening a PR.
- Match existing recipe configs — do not invent new event names.
