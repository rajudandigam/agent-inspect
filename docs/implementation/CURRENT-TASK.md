# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: c1-token-budget-fail-closed
currentTrain: c1-token-budget-fail-closed
trainStatus: "C1a #544 + C1b #543 local implementation ready for PR → Version Packages → Trusted Publish"
currentChunk: "C1a+C1b token budget fail-closed"
nextAction: "Merge C1 PR; Version Packages; Trusted Publish; close #544/#543"
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

## C0 / C0P (done)

**6.31.38** Trusted Publish with verified tarballs — all 18 registry packs include `dist/`.

## C1a + C1b (in progress)

| Item | Status |
| --- | --- |
| #544 per-budget `createLlmUsageRule` | implemented + tests |
| #543 eval `maxTotalTokens` fail-closed | implemented + tests |

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |
