# Add NestJS JSON logging recipe

## Problem

NestJS agents and APIs often use structured logging (built-in or pino/winston integration), but no recipe shows NestJS → AgentInspect log inspection.

## Why it matters

Enterprise TypeScript teams frequently use NestJS; a recipe bridges framework logging to local execution trees.

## Proposed scope

- Minimal NestJS-style app or script emitting JSON lines compatible with `agent-inspect logs`.
- Config file for run-id / event / timestamp key mapping.
- README with integration steps (no full NestJS app required if a simulated logger suffices for determinism).

## Out of scope

- Official NestJS module / DI integration package.
- `@nestjs/*` as core dependency.

## Acceptance criteria

- [ ] Deterministic, no external services
- [ ] Documents key field mapping for NestJS-like log shape
- [ ] Linked from `docs/LOGS.md` or integration section

## Suggested files

- `examples/recipes/nestjs-json-logging/` (new)
- `docs/LOGS.md`
- `examples/recipes/README.md`

## Tests to add

- Optional recipe smoke

## Labels

`good first issue`, `examples`, `integration`, `documentation`

## Difficulty

**Good first issue**
