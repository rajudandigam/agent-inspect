# Stats command proposal

**Labels:** `help wanted`, `cli`, `roadmap-next`

**Difficulty:** Intermediate (design / proposal)

## Problem

Users inspecting local traces often want lightweight aggregates — step counts, error rates, duration totals — without standing up a dashboard or production monitoring stack.

## Why it matters

Local aggregates support inner-loop debugging and CI summaries while staying aligned with AgentInspect boundaries (no fleet APM, no cost engine).

## Proposed scope

- Design proposal for `agent-inspect stats`:
  - **Input:** one run id or directory of traces
  - **Output:** human-readable summary and optional `--json`
  - **Metrics sketch:** step counts by type, error count, total/average duration, tool vs LLM breakdown
- Document proposed flags and sample output in `docs/CLI.md` (Proposed commands).
- Optional RFC file under `docs/community/proposals/stats-command.md`.

## Out of scope

- Hosted analytics, sampling agents, or fleet-wide aggregation.
- Cost/token billing reconciliation (no cost engine).
- Implementation in the same PR unless maintainer approves scope expansion.

## Suggested files

- `docs/CLI.md`
- `docs/community/proposals/stats-command.md` (optional)
- `ROADMAP.md`

## Acceptance criteria

- [ ] Proposal defines CLI UX, inputs, and at least one mock output
- [ ] Explicitly states stats are **local-only** and not production monitoring
- [ ] Compatible with `schemaVersion: "0.1"` event names
- [ ] Cross-linked from ROADMAP **Next** if accepted

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Share which stats would help your workflow (RAG, tool-heavy agents, eval harnesses).
- Keep proposals honest about log-derived vs manual trace fidelity differences.
