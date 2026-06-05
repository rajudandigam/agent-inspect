# Add pino JSON logging recipe

## Problem

Many Node.js agent services use pino for structured logs, but there is no dedicated recipe showing pino → `agent-inspect logs` / `tail` workflow.

## Why it matters

pino is a common production logger; a recipe lowers adoption friction for log-to-tree without manual `inspectRun` wrapping.

## Proposed scope

- Add `examples/recipes/pino-json-logging/` (or extend `examples/06-log-to-tree`) with:
  - Minimal pino JSON lines including `requestId`, `event`, `timestamp`
  - `agent-inspect.logs.json` config sample
  - README with `logs` and `tail` commands
- Deterministic output markers per recipe standards.
- Link from `docs/LOGS.md` and `docs/LOG-TO-TREE-QUICKSTART.md`.

## Out of scope

- Adding pino as a runtime dependency to `agent-inspect` core.
- pino transport monkey-patching.

## Acceptance criteria

- [ ] Recipe runs without external services (`pnpm start` or documented script)
- [ ] `pnpm recipes:check` passes (if recipe registered)
- [ ] Synthetic log data only
- [ ] Linked from public docs

## Suggested files

- `examples/recipes/pino-json-logging/` (new)
- `docs/LOGS.md`
- `docs/LOG-TO-TREE-QUICKSTART.md`
- `examples/recipes/README.md`

## Tests to add

- Optional: extend `recipes-smoke.test.ts` if recipe added to validation manifest

## Labels

`good first issue`, `examples`, `integration`, `documentation`

## Difficulty

**Good first issue**
