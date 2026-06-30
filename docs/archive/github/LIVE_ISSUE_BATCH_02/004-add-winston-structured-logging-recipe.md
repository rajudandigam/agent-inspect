# Add Winston structured logging recipe

**Labels:** `good first issue`, `examples`, `logging`

**Difficulty:** Good first issue

## Problem

The [logging playbook](../../docs/LOGGING-PLAYBOOK.md) covers pino, log4js, and NestJS patterns. Winston is widely used for structured JSON logging, but there is no deterministic AgentInspect recipe showing how `agent-inspect logs` ingests Winston-shaped lines.

## Why it matters

Winston users should see a local, copy-pasteable pattern without adding Winston to core or shipping a helper package prematurely.

## Proposed scope

- Add `examples/recipes/winston-json-logs/` with:
  - `README.md`
  - `package.json` (recipe-local deps only — `tsx`, `agent-inspect` file ref pattern like other recipes)
  - `src/index.ts` or generator script producing deterministic JSON log lines
  - `sample-winston.log` (or generated output committed as sample)
  - `agent-inspect.logs.json` ingest config
  - `expected-output.txt`
- Update [docs/LOGGING-PLAYBOOK.md](../../docs/LOGGING-PLAYBOOK.md) with a Winston section and link.
- Register in [examples/recipes/README.md](../../examples/recipes/README.md) and `scripts/validate-recipes.mjs` if required.

## Out of scope

- No `@agent-inspect/winston` package.
- No Winston dependency in root or `packages/core`.
- No external service calls or real API keys.

## Suggested files

- `examples/recipes/winston-json-logs/` (new)
- `docs/LOGGING-PLAYBOOK.md`
- `examples/recipes/README.md`
- `scripts/validate-recipes.mjs` (if new recipe needs registration)

## Acceptance criteria

- [ ] Example uses deterministic fake data only
- [ ] No real secrets in sample logs
- [ ] `agent-inspect logs` works with provided config (document CLI command in README)
- [ ] `pnpm recipes:check` passes

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm recipes:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Match structure of [examples/recipes/pino-json-logs](../../examples/recipes/pino-json-logs/) or [log4js-json-layout](../../examples/recipes/log4js-json-layout/).
- Winston may be a **devDependency of the recipe folder only** — confirm with maintainer if unsure.

## Maintainer note

Future optional logging packages are ROADMAP Future (~v1.6.0) — recipes first, packages only if justified.
