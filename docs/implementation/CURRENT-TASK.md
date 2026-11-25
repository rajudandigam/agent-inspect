# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: residual-after-63146
currentTrain: residual-after-63146
trainStatus: "Published through 6.31.46; routine maintenance continues; #496/#506 left red while checks fail"
currentChunk: "docs/state reconcile after 6.31.46"
nextAction: "Continue maintainer patches as needed; partner acceptance (#484/#437/#450); no 6.32 without EVIDENCE_GATE. Leave #496/#506 red while CI fails."
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
deferredLimitations: docs/KNOWN-ISSUES.md#deferred-p2-recipe-verifier-limitations
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3; partner #484/#437; Frank PROPOSED-527 API decisions before a public acceptance surface"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
  - .worktrees/
  - .webmcp-integration-work/
  - release-artifacts/
```

## Note

N1–N7 shipped through **6.31.46**. Synthetic recipe verifiers still have deferred P2 qualification gaps (F1–F5); see [KNOWN-ISSUES](../KNOWN-ISSUES.md#deferred-p2-recipe-verifier-limitations). Issues, PRs, and collaboration remain open as usual. Do not treat recipe PASS as external-effect or authorization proof until those gaps are closed.

## Completed

| Chunk | Release | Notes |
| --- | --- | --- |
| N1 | **6.31.41** | malformed budget fail-closed |
| N2 | **6.31.42** | eval/check logical LLM budgets |
| N3 | **6.31.43** | unfinished-after order; refund identity joins |
| N4 | **6.31.44** | Gary/Uduak/Roy/Om saved-evidence repairs |
| N5 | **6.31.45** | Kyle timeout correlated read-back |
| N6 | **design** | PROPOSED-527 repeated-run acceptance (no public API yet) |
| N7 | **6.31.46** | finding preview bounds + starter/roadmap docs |

## Residual queue

| Item | Status |
| --- | --- |
| F1–F5 recipe verifier P2 limits | deferred — see KNOWN-ISSUES |
| #496 / #506 | leave red while checks fail (grouped majors) |
| Partner #484 / #437 / #450 | open |
| 6.32 / v7 | blocked on EVIDENCE_GATE / NO-GO |
