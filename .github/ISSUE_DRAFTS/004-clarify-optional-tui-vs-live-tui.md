# Clarify optional TUI vs live tail

## Problem

Users conflate `@agent-inspect/tui` (`view --tui`) with live log tailing (`agent-inspect tail`) or expect streaming trace updates inside the TUI.

## Why it matters

Honest docs prevent mis-set expectations and reduce issues asking for SaaS-style live dashboards.

## Proposed scope

- Update `docs/ADAPTERS.md`, `docs/CLI.md`, and/or `docs/KNOWN-ISSUES.md` with a comparison table:
  - TUI: interactive trace viewer for existing JSONL runs
  - `tail`: live structured log ingestion
  - What is not supported (live streaming tree in TUI, vendor upload)
- Cross-link `examples/06-log-to-tree` and TUI install snippet.

## Out of scope

- Implementing live streaming in TUI.
- New dependencies.

## Acceptance criteria

- [ ] Clear "TUI vs tail" section exists in public docs
- [ ] Experimental labels preserved for TUI programmatic API
- [ ] Links verified

## Suggested files

- `docs/ADAPTERS.md`
- `docs/CLI.md`
- `docs/KNOWN-ISSUES.md`
- `README.md` (optional short cross-link)

## Tests to add

- None (docs-only).

## Labels

`documentation`, `good first issue`, `cli`

## Difficulty

**Good first issue**
