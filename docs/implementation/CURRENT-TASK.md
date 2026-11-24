# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: n5-kyle-timeout-readback
currentTrain: n5-kyle-timeout-readback
trainStatus: "N4 published 6.31.44; N5 local — Kyle read-back; awaiting gate/publish"
currentChunk: "N5 Kyle timeout correlated read-back"
nextAction: "Gate + changeset publish 6.31.45; then N6 design + N7 docs. Leave #496/#506 red."
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3; partner #484/#437; Frank N6 design before public API"
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
| N1 | **6.31.41** | malformed budget fail-closed |
| N2 | **6.31.42** | eval/check logical LLM budgets |
| N3 | **6.31.43** | unfinished-after order; refund identity joins |
| N4 | **6.31.44** | Gary/Uduak/Roy/Om saved-evidence repairs |
| N5 | **pending** | Kyle timeout correlated read-back |

## Residual queue

| Item | Status |
| --- | --- |
| N6 Frank acceptance design | design/manual (no public API) |
| N7 docs / Dependabot | leave #496/#506 red |
| 6.32 / v7 | blocked on EVIDENCE_GATE |
