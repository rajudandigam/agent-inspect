# Vitest reporter proposal

## Problem

Teams running agent tests in Vitest may want trace artifacts or summary lines in CI logs without a hosted observability platform.

## Why it matters

CI reporters bridge local inspection and automated test runs — aligned with **Next** roadmap integrations.

## Proposed scope

- Design doc for optional `@agent-inspect/vitest-reporter` or documented pattern using `inspectRun` + artifact upload in CI (files only).
- Example vitest config snippet (pseudo-package name OK in proposal).
- Clarify: no network upload by default; writes local JSONL or prints summary to stdout.

## Out of scope

- New published package in this issue unless maintainer approves scope.
- Vitest dependency in core `agent-inspect` package.

## Acceptance criteria

- [ ] Proposal in `docs/community/proposals/vitest-reporter.md` or `docs/ADAPTERS.md`
- [ ] Example config with synthetic test
- [ ] Dependency isolation plan documented

## Suggested files

- `docs/community/proposals/vitest-reporter.md` (new)
- `docs/ADAPTERS.md`
- `ROADMAP.md`

## Tests to add

- N/A for proposal phase.

## Labels

`integration`, `enhancement`, `documentation`

## Difficulty

**Intermediate**
