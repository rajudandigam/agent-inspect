# Add log4js JSON layout recipe

## Problem

log4js users need clarity on which layouts work with AgentInspect's best-effort parser (embedded JSON payloads).

## Why it matters

log4js is common in enterprise Node codebases; a recipe shows the supported JSON layout pattern and limits.

## Proposed scope

- Recipe demonstrating log4js configuration that emits recoverable JSON per line.
- Sample log file + `agent-inspect logs --format log4js` commands.
- Document limitations (no JS object literals) in recipe README.
- Reuse patterns from `fixtures/logs/proactive-log4js.log` where possible.

## Out of scope

- Full log4js layout parser for non-JSON lines.
- log4js dependency in core package.

## Acceptance criteria

- [ ] Recipe README explains best-effort parsing
- [ ] CLI commands documented
- [ ] Synthetic data only
- [ ] Linked from `docs/LOGS.md`

## Suggested files

- `examples/recipes/log4js-json-layout/` (new)
- `fixtures/logs/proactive-log4js.log` (reference)
- `docs/LOGS.md`
- `examples/recipes/README.md`

## Tests to add

- Optional recipe smoke entry

## Labels

`good first issue`, `examples`, `integration`, `documentation`

## Difficulty

**Good first issue**
