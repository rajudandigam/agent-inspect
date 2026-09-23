# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.31.7"
publishedVersion: "6.31.7"
pendingPublishVersion: null
currentTrain: "correctness-after-6316"
trainStatus: "active"
executionMode: "maintainer-reviewed"
namedTrain: "correctness-after-6316"
branch: "main"
currentChunk: "Chunk 1A AI SDK docs (P06) parallel with 6.31.7 correctness (#454/P03)"
lastConfirmedCommit: "3f7b4afd"
lastValidationLevel: "publish 35746970241 success; packed redact@6.31.6 canary retest PASS"
nextAction: "P06 AI SDK docs; P27 review #454 + Changeset; P03A/B/C; do not merge Dependabot #444/#445/#446"
pendingManualGate: "EVIDENCE_GATE not approved; FreshCtx #450 partner reruns parallel"
githubIssues:
  "450": "open — permission granted; private v3 qualified; partner Revera pending"
  "453": "open — timeline; with #454 for 6.31.7"
  "437": "open — receipt/idempotency; later evidence train"
  "209": "open — packed OS/Node matrix"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.31.6 false-SAFE marker-slash + multihost MongoDB (#455/#456)"
  - "6.31.5 connection URI userinfo (#451)"
  - "6.31.4 URL-aware http(s) + FS permissions"
  - "P05 website headers/crawler (#458)"
  - "OTLP BigInt timestamps (shipped; keep tests)"
  - "Chunk 0 public-truth marker sync + roadmap reconcile"
blockedTrains:
  - "v7.0.0 (assessment only — V7_DECISION: NO-GO)"
amendments:
  - "Adoption freeze excluded"
  - "P01 deferred past 6.31.6"
worktreeIgnoreOnly:
  - ".redstamp/"
  - "redstamp-proposal-issue-body.md"
stopMarker: |
  LAST_PUBLISHED_RELEASE: 6.31.6
  ACTIVE: 6.31.7 correctness + P06 AI SDK docs
  NEXT: 6.31.8 export/OTLP
  V7_DECISION: NO-GO
  EVIDENCE_GATE: not approved
  ADOPTION_FREEZE: excluded
updatedAt: "2026-09-22"
```
