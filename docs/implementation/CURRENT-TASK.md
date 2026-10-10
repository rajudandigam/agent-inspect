# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: stability-after-63111
currentTrain: stability-after-63111
trainStatus: "6.31.18 published (all 18); Fix-Owes landed; 6.32 blocked"
currentChunk: "post-6.31.18 residual packets / external PRs"
nextAction: "Artifact-first partner drafts; plumbline #98; no 6.32 without EVIDENCE_GATE"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; C10 Elastic --live; Collector Docker"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
```

## Published baseline

**6.31.18** — all 18 packages on npm (Trusted Publish + confirm re-dispatch).

## Disposition ledger (2026-10-10)

| Item | Status |
| --- | --- |
| 6.31.17 | **published** |
| 6.31.18 | **published** (Fix-Owes recovery/OTLP/recipes/MCP SDK e2e) |
| W00 / W03 / W26 | **done** |
| W01 (#481–#483) | **closed** |
| W02 + F02 fidelity | **merged** proactive-ai-demo #6–#9 |
| W11 recovery | **shipped in 6.31.18** |
| W04 OTLP identity (#484) | **partial** — bounded structural attrs shipped |
| W15/W10 recipes (#491/#492) | **recipes shipped** |
| W18 MCP SDK packed (#488) | **packed-mcp-sdk-e2e in pack:smoke** |
| F11b plumbline | **PR open** askalf/plumbline#98 |
| F12 Indu/João | **still gated** |
| 6.32.0 | **BLOCKED_ON_EXTERNAL_EVIDENCE** |

## Stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.18
ACTIVE: stability-after-63111 (Oct 10 Fix-Owes published)
NEXT: residual partner packets; no 6.32 without EVIDENCE_GATE
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
