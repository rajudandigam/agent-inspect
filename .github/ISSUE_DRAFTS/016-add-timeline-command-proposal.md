# `timeline` command proposal

## Problem

Log-derived runs are often viewed as flat timelines with confidence labels. `view` emphasizes tree shape; some users want a chronological timeline-first CLI mode.

## Why it matters

Timeline-oriented output matches how structured logs are emitted and helps debug ordering issues in parallel agent work.

## Proposed scope

- Design proposal doc (and optional RFC issue comment) for `agent-inspect timeline`:
  - Input: trace JSONL or log file + config
  - Output: chronological events with confidence, durations, kinds
  - Flags: `--json`, `--summary`, `--dir`
- No implementation required in first PR — proposal + mock output in `docs/CLI.md` "Proposed commands" section.

## Out of scope

- SaaS timeline UI.
- Live streaming vendor pipeline.
- Implementation in same PR unless maintainer expands scope.

## Acceptance criteria

- [ ] Proposal document with command sketch and sample output
- [ ] Aligns with `InspectEvent` model in `docs/SCHEMA.md`
- [ ] Listed under **Next** in `ROADMAP.md` if accepted

## Suggested files

- `docs/CLI.md` (proposed section)
- New: `docs/community/proposals/timeline-command.md` (optional)
- `ROADMAP.md` (cross-link)

## Tests to add

- N/A for proposal-only PR. Implementation issue would add CLI tests.

## Labels

`enhancement`, `cli`, `documentation`

## Difficulty

**Intermediate**
