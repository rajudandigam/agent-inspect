# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: n3-ordering-refund-parity
currentTrain: n3-ordering-refund-parity
trainStatus: "N3 implemented — unfinished-after ordering + refund identity/approval-before-action; gate pending"
currentChunk: "N3 core+recipe — validate then release"
nextAction: "Chunk gate; changeset; push; Version Packages; Trusted Publish 6.31.43; then N4. Leave #496/#506 red."
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3 artifact missing; partner acceptance #484/#437; Frank acceptance design (N6) before public API"
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
| N1 malformed budget | **6.31.41** | Reader discard warnings; check/eval token budgets fail unverifiable |
| N2 lifecycle parity | **6.31.42** | eval uses `projectLogicalEvents` for token budgets |
| N3 ordering / refund | **pending** | unfinished-after not masked; refund joins by identity + approval-before-action |

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| N4 older evidence promises | **next after N3 publish** | Gary / Uduak / Roy / Om |
| N5 Kyle timeout | **queued** | correlated read-back evidence |
| N6 Frank acceptance design | **manual/design** | no public API until design approved |
| N7 docs / Dependabot | **queued** | keep #496/#506 red while checks fail |
| #484 / #437 / #450 | **open** | partner / EVIDENCE_GATE |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |
