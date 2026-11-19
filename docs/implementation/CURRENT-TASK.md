# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: c0p-packaging-repair
currentTrain: c0p-packaging-repair
trainStatus: "C0P complete — 6.31.38 Trusted Publish verified; all 18 registry tarballs include dist/"
currentChunk: "C0+C0P packaging repair + repair release (DONE)"
nextAction: "C1a #544 per-budget completeness; then C1b #543"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3 artifact missing; partner acceptance #484/#437"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
  - .worktrees/
  - .webmcp-integration-work/
  - release-artifacts/
```

## C0 / C0P outcome (2026-11-19)

| Fact | Value |
| --- | --- |
| Baseline SHA | `504db32` / empty scoped `6.31.37` |
| Repair release | **6.31.38** |
| Publish run | [44610202455](https://github.com/rajudandigam/agent-inspect/actions/runs/44610202455) |
| Registry check | all **18** packages re-downloaded; every scoped pack has `dist/` (langchain 9 files) |
| PRs | #549 (C0P), #550 (Version Packages), #551/#552/#553 (qualify/publish path fixes) |

**Do not use empty scoped `6.31.37`.** Prefer `6.31.38+`.

## Published baseline

**6.31.38** — Trusted Publish [44610202455](https://github.com/rajudandigam/agent-inspect/actions/runs/44610202455); Version Packages [#550](https://github.com/rajudandigam/agent-inspect/pull/550). Prior broken scoped **6.31.37**: leave as-is unless a separate deprecation message is authorized.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #544 | **next** | C1a per-budget completeness |
| #543 | **queued** | C1b eval maxTotalTokens |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
