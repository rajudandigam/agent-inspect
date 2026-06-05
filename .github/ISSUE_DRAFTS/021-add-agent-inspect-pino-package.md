# Add @agent-inspect/pino optional package

## Problem

Teams using pino must hand-craft JSON field conventions and CLI commands. A thin optional package could document and optionally wrap pino child loggers with consistent `runId` / `event` fields—without pulling pino into `agent-inspect` core.

## Why it matters

pino is ubiquitous in Node agent services. An optional adapter lowers friction while keeping the root install dependency-light.

## Proposed scope

- New package `@agent-inspect/pino` (peer: `pino`)
- Export helpers:
  - `createAgentInspectPinoLogger(options)` — child logger with bound `runId`
  - `logAgentEvent(logger, event, fields)` — enforces `event` + timestamp shape
  - Re-export sample `agent-inspect.logs.json` path or embedded defaults
- **No** transport upload, **no** monkey-patching global console
- Docs link to `examples/recipes/pino-json-logs/` and `docs/LOGGING-PLAYBOOK.md`

## Out of scope

- Adding pino to root `agent-inspect` or `@agent-inspect/core`
- SaaS / vendor sinks
- Automatic log shipping

## Acceptance criteria

- [ ] Peer dependency on `pino` only in optional package
- [ ] Deterministic unit tests with mock logger / memory stream
- [ ] Recipe remains valid without the package (docs-only path still works)
- [ ] Published separately from core (`@agent-inspect/pino`)

## Suggested files

- `packages/pino/` (new)
- `docs/LOGGING-PLAYBOOK.md`
- `examples/recipes/pino-json-logs/`

## Labels

`maintainer-owned`, `integration`, `enhancement`

## Difficulty

**Maintainer-owned**
