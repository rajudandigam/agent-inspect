# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.29.0"
publishedVersion: "6.29.0"
pendingPublishVersion: null
currentTrain: "post-6.25-reliability-complete"
trainStatus: "stopped"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-reliability-evidence-v6.25.1-to-v6.30"
branch: "main"
currentChunk: "none"
lastConfirmedCommit: "origin/main"
lastValidationLevel: "npm-6.29.0-published"
nextAction: "No further release in this train without external evidence"
pendingManualGate: "main branch protection; Dependabot #372/#373 close-or-split; #368 defer; Actions PRs #367/#369/#370/#371 rebase independently"
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix PARTIAL"
  "295": "park — VS Code Marketplace unpublished (Option A)"
  "362": "shipped in 6.26.0 (synthetic); external gist still BLOCKED_ON_EXTERNAL_FIXTURE for closure claims"
  "115": "park/close unless active ADPA partner"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "immediate release-truth gate"
  - "6.25.1 critical correctness"
  - "6.25.2 skipped (clean)"
  - "6.26.0 behavioral sessions"
  - "6.27.0 bounded recovery"
  - "6.28.0 Evidence contract binding"
  - "6.29.0 usage fidelity + AI SDK peer matrix"
remainingTrains: []
blockedTrains:
  - "6.30.0 external conformance (BLOCKED_ON_EXTERNAL_EVIDENCE)"
  - "retained-use adoption claim (BLOCKED_ON_EXTERNAL_EVIDENCE)"
  - "v7.0.0 (assessment only — docs/implementation/active/V7-READINESS-ASSESSMENT.md) — V7_DECISION: NO-GO"
stopMarker: |
  BLOCKED_ON_EXTERNAL_EVIDENCE
  LAST_IMPLEMENTED_RELEASE: 6.29.0
  V7_DECISION: NO-GO
updatedAt: "2026-09-13"
```
