# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: correctness-after-6316
currentTrain: correctness-after-6316
trainStatus: active
currentChunk: "Next: 6.31.7 — P27 timeline (#454) + P03A/B/C false-pass checks"
nextAction: "Review/merge #454 with maintainer Changeset; implement P03A/B/C independently; optional P01 exact custom rules"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved; #450 FreshCtx partner Revera reruns parallel"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
```

## Published baseline

**6.31.6** on npm (Trusted Publish) — false-SAFE marker-slash + multihost MongoDB residuals closed (#455 → Version Packages #456). Packed `@agent-inspect/redact@6.31.6` canary retest PASS.

## Sequenced status

| Item | Status |
| --- | --- |
| 6.31.6 P02 false-SAFE residuals | **published** |
| P01 exact custom-rule matching | deferred → next patch if ready |
| #454 / #453 timeline | open → **6.31.7** (P27) |
| P03A/B/C false-pass checks | **6.31.7** |
| P07/P20 OTLP | 6.31.8 |
| #450 FreshCtx | parallel P11; permission granted; partner rerun pending |
| #444/#445/#446 Dependabot | do not merge until P28 |
| Adoption freeze | excluded |
| V7 | NO-GO |

## Stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.6
ACTIVE: 6.31.7 correctness (timeline + false-pass checks)
NEXT: 6.31.8 OTLP export
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
