# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: nov14-followups-release
currentTrain: nov14-followups-release
trainStatus: "merged Nov14 PRs on main; changeset queued for 6.31.36; 6.32 blocked"
currentChunk: "changeset → Version Packages → Trusted Publish 6.31.36"
nextAction: "Merge Version Packages PR when green; confirm npm 6.31.36; leave #496/#506 red; partner #484/#437 hold"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3 artifact missing; partner acceptance #484/#437"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
  - .worktrees/
```

## Published baseline

**6.31.35** — Trusted Publish [41899701747](https://github.com/rajudandigam/agent-inspect/actions/runs/41899701747); Version Packages [#531](https://github.com/rajudandigam/agent-inspect/pull/531). npm `agent-inspect@6.31.35` (registry confirmed). **6.31.36** in flight (Nov 14 follow-ups: #535/#538/#539/#540/#542/#526).

## Nov 4 residual train (done)

| Chunk | Status | Notes |
| --- | --- | --- |
| C12 diagnostics polish | **shipped 6.31.35** | #522 follow-up bound/order + observation note |
| C13 Dependabot / Actions | **reviewed** | #496/#506 leave red; #444/#500/#501 not merged |
| C14 entity/value recipe | **shipped 6.31.35** | #527 recipe-local TraceCheckRule |
| C15 RETRIEVER order | **shipped 6.31.35** | illustrative OI fixtures + recipe-local rule |
| C16 trust-boundary docs | **shipped 6.31.35** | LIMITATIONS + PARKED-DESIGNS |

Earlier C01–C11 remains as recorded for **6.31.34**.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #526 | **open** | Windows docs; maintainer merge call |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
