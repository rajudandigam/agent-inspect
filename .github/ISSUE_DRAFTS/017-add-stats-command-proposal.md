# `stats` command proposal

## Problem

Users want quick aggregates (step counts, error counts, total duration, tool vs LLM breakdown) without building a dashboard.

## Why it matters

Local stats support inner-loop performance debugging after prompt or model changes.

## Proposed scope

- Proposal for `agent-inspect stats <run-id>` building on `buildRunSummary` / `extractMetadata`.
- Sample output using existing summary fields.
- Document relationship to `view --summary`.

## Out of scope

- Multi-run fleet analytics.
- Cost/token billing stats as product features.
- Hosted metrics backend.

## Acceptance criteria

- [ ] Command sketch and flags documented
- [ ] Sample output from `minimal-success` fixture
- [ ] Notes that stats are local file reads only

## Suggested files

- `docs/CLI.md`
- Optional: `docs/community/proposals/stats-command.md`
- `packages/core/src/trace-metadata.ts` (reference for fields)

## Tests to add

- N/A for proposal. Implementation: `packages/cli/test/stats.test.ts`.

## Labels

`enhancement`, `cli`, `documentation`

## Difficulty

**Intermediate**
