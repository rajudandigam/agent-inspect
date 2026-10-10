# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: stability-after-63111
currentTrain: stability-after-63111
trainStatus: "6.31.18 Fix-Owes landed + Changeset; Version Packages → Trusted Publish; 6.32 blocked"
currentChunk: "6.31.18 publish (Fix-Owes recovery/OTLP/recipes)"
nextAction: "Merge Version Packages PR; confirm npm 6.31.18; no 6.32 without EVIDENCE_GATE"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; C10 Elastic --live; Collector Docker"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
```

## Published baseline

**6.31.17** — all 18 packages on npm. **6.31.18** Changeset pending Version Packages / Trusted Publish.

## Disposition ledger (2026-10-10)

| Item | Status |
| --- | --- |
| 6.31.17 | **published** |
| 6.31.18 | **Changeset + code on main** (recovery/OTLP/recipes Fix-Owes) |
| W00 / W03 / W26 | **done** |
| W01 (#481–#483) | **closed** |
| W02 demo #3–#5 | **merged** proactive-ai-demo #6–#8; F02 fidelity follow-up separate |
| W11 recovery | **landed in 6.31.18** (result availability + attemptId mix) |
| W04 OTLP identity (#484) | **partial** — bounded structural attrs in exporter |
| W15/W10 recipes (#491/#492) | **recipes landed** |
| W18 MCP SDK packed (#488) | **packed-mcp-sdk-e2e in pack:smoke** |
| 6.32.0 | **BLOCKED_ON_EXTERNAL_EVIDENCE** |

## Stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.17
PENDING_PUBLISH: 6.31.18
ACTIVE: stability-after-63111 (Oct 10 Fix-Owes)
NEXT: Version Packages merge → publish.yml; no 6.32 without EVIDENCE_GATE
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
