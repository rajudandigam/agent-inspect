# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.8"
publishedVersion: "6.31.8"
pendingPublishVersion: null
currentTrain: "integration-honesty-after-6317"
trainStatus: "active"
executionMode: "maintainer-reviewed"
namedTrain: "integration-honesty-after-6317"
branch: "main"
currentChunk: "P1 integration honesty (export coalesce, starters, metadata, recipe honesty)"
lastConfirmedCommit: "3c3cbeda"
lastValidationLevel: "publish 35805311785 success; npm 6.31.7"
nextAction: "Maintainer review of honesty patches; Changeset publish when authorized; do not claim Collector/Elastic destination observed without live evidence"
pendingManualGate: "Elastic --live credentials; external Promptfoo reproduction; EVIDENCE_GATE not approved"
githubIssues:
  "450": "open — permission granted; private v3 qualified; partner Revera pending"
  "437": "open — receipt/idempotency; later evidence train"
  "209": "open — packed OS/Node matrix"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.7 timeline + export/OTLP train (#459/#460)"
  - "6.31.6 false-SAFE marker-slash + multihost MongoDB (#455/#456)"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
amendments:
  - "Adoption freeze excluded"
  - "P03 still blocked (no audit probes)"
  - "Recipe layout ≠ destination verification"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.7
  ACTIVE: integration honesty after 6.31.7
  NEXT: patch publish + external Promptfoo kit
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-09-26"
```
