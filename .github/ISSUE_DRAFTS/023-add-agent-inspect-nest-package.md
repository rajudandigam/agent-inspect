# Add @agent-inspect/nest optional package

## Problem

NestJS apps use `Logger` / `LoggerService` with `message` + `context` fields. Developers must align those fields with `agent-inspect.logs.json` manually.

## Why it matters

Nest is a common host for agent HTTP APIs. A optional `LoggerService` wrapper could emit inspect-friendly JSON lines locally.

## Proposed scope

- New package `@agent-inspect/nest` (peer: `@nestjs/common`)
- Export `AgentInspectLoggerService` implementing `LoggerService`:
  - Writes JSON lines to stdout or a file stream (local only)
  - Requires `runId` + `event` on agent lifecycle methods
  - Maps `context` to Nest service name
- Dynamic module `AgentInspectLoggingModule.forRoot({ traceDir?, config? })` — **local file options only**
- Link to `examples/recipes/nestjs-json-logging/` and playbook

## Out of scope

- Nest dependency in core/root
- OpenTelemetry / vendor exporters
- HTTP interceptors that upload logs

## Acceptance criteria

- [ ] Peer deps isolated to optional package
- [ ] Sample JSON lines match `fixtures/logs/nestjs-agent-json.log` shape
- [ ] `agent-inspect logs` + config parses output without warnings on happy path

## Suggested files

- `packages/nest/` (new)
- `fixtures/logs/nestjs-agent-json.log`
- `examples/recipes/nestjs-json-logging/`

## Labels

`maintainer-owned`, `integration`, `enhancement`

## Difficulty

**Maintainer-owned**
