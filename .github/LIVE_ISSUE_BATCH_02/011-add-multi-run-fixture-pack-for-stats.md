# Add multi-run fixture pack for future stats command

**Labels:** `fixtures`, `testing`, `roadmap-next`

**Difficulty:** Intermediate

## Problem

The proposed `stats` CLI command ([#12](https://github.com/rajudandigam/agent-inspect/issues/12)) needs a deterministic fixture directory with multiple runs representing different profiles: success, failure, slow tool, LLM-heavy, tool-heavy.

## Why it matters

Fixture packs enable future tests and design docs without implementing stats analytics, dashboards, or databases now.

## Proposed scope

- Add `fixtures/runs/stats-sample/` with **5–8** small JSONL trace files.
- Include varied profiles:
  - Clean success run
  - Run with failed step
  - Slow tool step (synthetic durations)
  - LLM-heavy run (multiple `step.llm`-style events)
  - Tool-heavy run (multiple tool steps)
- Add `fixtures/runs/stats-sample/README.md` describing each file.
- Extend fixture validation if needed (`scripts/validate-fixtures.mjs`).

## Out of scope

- No `stats` command implementation.
- No analytics database or aggregation engine.
- No dashboard or web UI.
- No changes to core CLI behavior.

## Suggested files

- `fixtures/runs/stats-sample/` (new)
- `fixtures/README.md`
- `scripts/validate-fixtures.mjs` (if directory needs registration)
- Optional cross-link from stats proposal issue #12

## Acceptance criteria

- [ ] 5–8 deterministic JSONL files, all schema-valid
- [ ] README explains each run's purpose
- [ ] No secrets or customer data
- [ ] `pnpm fixtures:check` passes
- [ ] Useful as future stats command test input

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Use synthetic run names and metadata.
- Keep each file small — stats tests should not require multi-MB traces.

## Maintainer note

Stats command design remains help-wanted issue #12 — fixtures only prepare the ground.
