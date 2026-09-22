# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: security-false-safe-6316
currentTrain: security-false-safe-6316
trainStatus: active
currentChunk: "P02 — close two false-SAFE sharing residuals (marker-slash + multihost MongoDB)"
nextAction: "Implement P02A/P02B on main; optional P01 if ready; Changeset → Version Packages → Trusted Publish as 6.31.6"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved; #450 FreshCtx partner Revera reruns do not block 6.31.6"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
```

## Published baseline

**6.31.5** on npm (Trusted Publish) at main `906de28b229f433928ba43a0456cd1c1e2c5b8c8` (all 18 fixed-group packages). History: #436/#449 → 6.31.4; #451 connection URI userinfo → 6.31.5. #443 closed unmerged (superseded by #449).

## Sequenced status

| Item | Status |
| --- | --- |
| 6.31.4 URL-aware http(s) + complete-marker residual | published |
| 6.31.5 connection URI userinfo strip | published |
| P00 state reconcile | this train |
| P02A/B false-SAFE residuals | **active → 6.31.6** |
| P01 exact custom-rule matching | optional same patch if ready; else next patch |
| #454 / #453 timeline cycle-safe | open; target 6.31.7 (P27) |
| P03A/B/C false-pass checks | 6.31.7 |
| P07/P20 OTLP | 6.31.8 |
| #450 FreshCtx (permission granted) | parallel P11; does not block 6.31.6 |
| #444/#445/#446 Dependabot | do not merge until P28 split/retest |
| Adoption freeze | excluded (optional; not a release prerequisite) |
| 6.32.0 additive evidence | after security/correctness patches; EVIDENCE_GATE still not approved |
| V7 | NO-GO |

## Stop marker

```text
LAST_PUBLISHED_RELEASE: 6.31.5
ACTIVE: P02 false-SAFE sharing → proposed 6.31.6
RESERVED: 6.32.0 evidence capability (not an empty minor)
V7_DECISION: NO-GO
EVIDENCE_GATE: not approved
ADOPTION_FREEZE: excluded
```
