# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: nov14-followups-release
currentTrain: nov14-followups-release
trainStatus: "6.31.37 published; WebMCP evidence-defect train complete; 6.32 blocked"
currentChunk: "6.31.37 published — gen_ai.tool.name + recipe claim verify"
nextAction: "Partner acceptance #484/#437; leave #496/#506 red; no 6.32 without EVIDENCE_GATE"
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
```

## Published baseline

**6.31.37** — Trusted Publish [44215415755](https://github.com/rajudandigam/agent-inspect/actions/runs/44215415755); Version Packages [#546](https://github.com/rajudandigam/agent-inspect/pull/546). npm `agent-inspect@6.31.37` (registry confirmed). Includes `gen_ai.tool.name` matching + strengthened `webmcp-native-evidence` recipe. Prior **6.31.36**: [43735681865](https://github.com/rajudandigam/agent-inspect/actions/runs/43735681865) / [#545](https://github.com/rajudandigam/agent-inspect/pull/545). Open follow-ups: #543 (eval maxTotalTokens), #544 (per-budget matrix).

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
