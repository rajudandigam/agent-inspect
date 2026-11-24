# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: n4-saved-evidence-repairs
currentTrain: n4-saved-evidence-repairs
trainStatus: "N4 gated — pushing for 6.31.44 Trusted Publish"
currentChunk: "N4 commit/push/Version Packages"
nextAction: "Push N4; merge Version Packages; verify npm 6.31.44; then N5–N7. Leave #496/#506 red."
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
| N4 | **pending publish** | Gary/Uduak/Roy/Om saved-evidence repairs (gated) |

## Residual queue

| Item | Status |
| --- | --- |
| N5 Kyle timeout | next after N4 publish |
| N6 Frank acceptance design | design/manual |
| N7 docs / Dependabot | leave #496/#506 red |
| 6.32 / v7 | blocked on EVIDENCE_GATE |
