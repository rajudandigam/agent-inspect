# Timeline command proposal

**Labels:** `help wanted`, `cli`, `roadmap-next`

**Difficulty:** Intermediate (design / proposal)

## Problem

Log-derived runs are often viewed as **flat timelines** with confidence labels. `agent-inspect view` emphasizes tree shape; some users want a chronological, timeline-first CLI mode for ordering and parallel work debugging.

## Why it matters

Timeline-oriented output matches how structured logs are emitted and helps debug ordering issues in parallel agent workflows — still local-first, no dashboard required.

## Proposed scope

- Write a design proposal for `agent-inspect timeline`:
  - **Input:** trace JSONL and/or log file + ingest config
  - **Output:** chronological events with confidence, durations, step kinds
  - **Flags sketch:** `--json`, `--summary`, `--dir`, `--config`
- Add a **Proposed commands** subsection to `docs/CLI.md` with mock sample output.
- Optional: `docs/community/proposals/timeline-command.md` for longer RFC-style notes.
- Cross-link from [ROADMAP.md](../../ROADMAP.md) **Next**.

## Out of scope

- Implementation in the first PR (unless maintainer explicitly expands scope).
- SaaS timeline UI or hosted streaming pipeline.
- Vendor upload or live tail to cloud sinks.

## Suggested files

- `docs/CLI.md`
- `docs/community/proposals/timeline-command.md` (optional new file)
- `ROADMAP.md` (cross-link only if proposal is accepted)

## Acceptance criteria

- [ ] Proposal includes command name, inputs, outputs, and at least one mock terminal example
- [ ] Aligns with `InspectEvent` / log ingest model in [docs/SCHEMA.md](../../docs/SCHEMA.md)
- [ ] States confidence labels remain required for inferred relationships
- [ ] Listed under **Next** in ROADMAP if maintainers accept direction

## Validation commands

Docs-only proposal:

```bash
pnpm typecheck
pnpm test
```

If implementation follows in a separate issue: add CLI tests under `packages/cli/test/`.

## Notes for contributors

- Comment with your use case (manual traces vs log ingest vs LangChain persisted JSONL).
- Proposal-first PRs are welcome; maintainers will open a separate implementation issue if accepted.
