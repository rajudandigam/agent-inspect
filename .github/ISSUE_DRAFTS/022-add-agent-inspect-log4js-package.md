# Add @agent-inspect/log4js optional package

## Problem

log4js JSON layouts still emit text prefixes. Users must remember `--format log4js` and valid embedded JSON rules. An optional package could ship a tested appender/layout snippet and config defaults.

## Why it matters

log4js remains common in older Node services. Optional packaging clarifies best-effort limits and recommended JSON layout.

## Proposed scope

- New package `@agent-inspect/log4js` (peer: `log4js`)
- Export:
  - `agentInspectJsonLayout()` — serializes `{ event, runId, timestamp, ... }` as trailing JSON
  - Sample `agent-inspect.logs.json`
  - README with `--format log4js` examples
- **No** eval, **no** JS object literal examples
- **No** vendor sinks

## Out of scope

- log4js dependency in core/root
- Parsing non-JSON log4js patterns (pattern layouts without JSON)

## Acceptance criteria

- [ ] Layout output parses with existing `Log4jsParser`
- [ ] Tests use fixture-shaped lines only
- [ ] Recipe `log4js-json-layout` documents package when available

## Suggested files

- `packages/log4js/` (new)
- `fixtures/logs/log4js-agent-json.log`
- `examples/recipes/log4js-json-layout/`

## Labels

`maintainer-owned`, `integration`, `enhancement`

## Difficulty

**Maintainer-owned**
