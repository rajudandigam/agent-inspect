# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: n2-eval-check-lifecycle-parity
currentTrain: n2-eval-check-lifecycle-parity
trainStatus: "N2 committed — awaiting Version Packages → Trusted Publish 6.31.42"
currentChunk: "N2 release in flight"
nextAction: "Merge Version Packages PR; confirm Trusted Publish 6.31.42; then N3. Leave #496/#506 red."
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3 artifact missing; partner acceptance #484/#437; Frank acceptance design before public API"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
  - .worktrees/
  - .webmcp-integration-work/
  - release-artifacts/
```

## Completed this train

| Chunk | Release | Notes |
| --- | --- | --- |
| C0+C0P packaging | **6.31.38** | Verified-tarball Trusted Publish; all 18 packs include `dist/` |
| C1a #544 + C1b #543 | **6.31.39** | Per-budget `createLlmUsageRule`; eval `--max-total-tokens` fail-closed |
| Open PR triage | **6.31.40** | #559/`#558` traceSafety writers; #547/`#533` LangChain tokenUsage; #548 superseded |
| N1 malformed budget | **6.31.41** | Reader discard warnings; check/eval token budgets fail unverifiable |
| N2 lifecycle parity | **pending 6.31.42** | `eval` `llmEventsForTokenBudget` uses `projectLogicalEvents`; check/eval agree at 1499/1500/1501 |

Baseline HEAD at start: `2561eb3b`. Published npm remains **6.31.41** until Version Packages + Trusted Publish.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| N3 ordering / refund | **next after publish** | unfinished action; Frank cases |
| N4 older evidence promises | **queued** | Gary / Uduak / Roy / Om |
| N5 Kyle timeout | **queued** | correlated read-back evidence |
| N6 Frank acceptance design | **manual** | define semantics before public API |
| N7 docs / Dependabot | **queued** | keep #496/#506 red while checks fail |
| #484 / #437 / #450 | **open** | partner / EVIDENCE_GATE |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
- Do not claim N2 fixed on npm until Trusted Publish confirms 6.31.42.
