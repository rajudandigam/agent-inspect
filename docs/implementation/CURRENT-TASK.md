# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: residual-n1-n7-complete
currentTrain: residual-n1-n7-complete
trainStatus: "N1–N7 complete — published through 6.31.46; #496/#506 left red"
currentChunk: "none — residual plan finished"
nextAction: "Partner acceptance (#484/#437/#450); no 6.32 without EVIDENCE_GATE. Leave #496/#506 red."
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3; partner #484/#437; Frank acceptance API awaiting maintainer decisions in PROPOSED-527"
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
| N5 | **6.31.45** | Kyle timeout correlated read-back |
| N6 | **design** | PROPOSED-527 repeated-run acceptance (no public API) |
| N7 | **6.31.46** | finding preview bounds + starter/roadmap docs |

## Residual queue

| Item | Status |
| --- | --- |
| #496 / #506 | leave red (grouped majors) |
| Partner #484 / #437 / #450 | open |
| 6.32 / v7 | blocked on EVIDENCE_GATE / NO-GO |
