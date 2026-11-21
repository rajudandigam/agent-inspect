# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: open-pr-triage-6.31.40
currentTrain: open-pr-triage-6.31.40
trainStatus: "6.31.40 published — #559 traceSafety writers + #547 LangChain tokenUsage; open-PR triage complete"
currentChunk: "triage ship complete"
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
| Open PR triage | **6.31.40** | #559/`#558` `createInspector({ traceSafety })` → writers; #547/`#533` LangChain `tokenUsage` on `0.2` completions; #548 closed superseded |

Publish: [44942237531](https://github.com/rajudandigam/agent-inspect/actions/runs/44942237531). Issues #558/#533 closed; #548 superseded.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #496 / #506 | **leave red** | do not merge |
| #450 | **open** | partner Revera / EVIDENCE_GATE |
| Optional #548 edges | **park** | start-model-wins / writer-reject fallback / size-trunc keep usage — tiny follow-up only |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
- Dependabot majors (#532/#501/#500/#444) deferred; draft #513 parked.
