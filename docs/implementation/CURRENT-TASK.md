# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: n1-malformed-token-budget
currentTrain: n1-malformed-token-budget
trainStatus: "N1 shipped in 6.31.41 — discard warnings + token-budget fail-closed"
currentChunk: "N1 complete"
nextAction: "N2 check/eval lifecycle parity. Leave #496/#506 red; no 6.32 without EVIDENCE_GATE."
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

Publish: [45112687091](https://github.com/rajudandigam/agent-inspect/actions/runs/45112687091).

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| N2 check/eval lifecycle parity | **next** | exact-1500 LangChain start/completion double-count |
| N3 ordering / refund | **queued** | unfinished action; Frank cases |
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
