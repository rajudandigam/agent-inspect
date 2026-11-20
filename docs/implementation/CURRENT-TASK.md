# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: c1-token-budget-fail-closed
currentTrain: c1-token-budget-fail-closed
trainStatus: "C1a #544 + C1b #543 shipped in 6.31.39; handoff C0→C1 complete"
currentChunk: "C1 complete"
nextAction: "Handoff residuals only (partner #484/#437; leave #496/#506 red; no 6.32 without EVIDENCE_GATE)"
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

## Completed this train

| Chunk | Release | Notes |
| --- | --- | --- |
| C0+C0P packaging | **6.31.38** | Verified-tarball Trusted Publish; all 18 packs include `dist/` |
| C1a #544 + C1b #543 | **6.31.39** | Per-budget `createLlmUsageRule`; eval `--max-total-tokens` fail-closed |

Publish: [44652555068](https://github.com/rajudandigam/agent-inspect/actions/runs/44652555068). Issues #544/#543 closed.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
