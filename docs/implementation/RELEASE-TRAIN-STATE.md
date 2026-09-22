# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.5"
publishedVersion: "6.31.5"
pendingPublishVersion: "6.31.6"
currentTrain: "security-false-safe-6316"
trainStatus: "active"
executionMode: "maintainer-reviewed"
namedTrain: "security-false-safe-6316"
branch: "main"
currentChunk: "P02A/B — marker-slash free-text residual + multihost MongoDB authority"
lastConfirmedCommit: "906de28b229f433928ba43a0456cd1c1e2c5b8c8"
lastValidationLevel: "audit Sep 22: test:all 2308 pass; two share residuals reproduced on published 6.31.5"
nextAction: "Land P02 security patch Changeset; compose Version Packages → Trusted Publish 6.31.6"
pendingManualGate: "EVIDENCE_GATE not approved; FreshCtx #450 partner reruns parallel only"
githubIssues:
  "450": "open — FreshCtx permission granted; qualify private v3 (P11); does not block 6.31.6"
  "453": "open — timeline crash; review #454 for 6.31.7"
  "437": "open — receipt/idempotency; later evidence train"
  "209": "open — packed OS/Node matrix"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.4 URL-aware http(s) redaction + complete-placeholder residual (#449)"
  - "6.31.4 restrictive FS permissions (#436)"
  - "6.31.5 connection URI userinfo strip (#451)"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
amendments:
  - "Sep 22 audit supersedes website-first queue for next patches"
  - "Adoption freeze excluded; not a release prerequisite"
  - "Do not merge Dependabot #444/#445/#446 until P28 split/retest"
  - "Do not delay 6.31.6 for timeline/OTLP/FreshCtx partner work"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.5
  ACTIVE: P02 → proposed 6.31.6
  NEXT: 6.31.7 correctness (timeline + false-pass checks)
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-09-22"
```
