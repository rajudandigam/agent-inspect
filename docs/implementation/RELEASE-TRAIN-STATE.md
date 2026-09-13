# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.29.0"
publishedVersion: "6.29.0"
pendingPublishVersion: "6.25.1"
currentTrain: "repository-and-release-truth-gate"
trainStatus: "in-progress"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-reliability-evidence-v6.25.1-to-v6.30"
branch: "main"
currentChunk: "immediate-gate"
lastConfirmedCommit: "origin/main"
lastValidationLevel: "npm-6.25.0-published; post-6.25 program planned"
nextAction: "Complete release-truth gate → implement and publish 6.25.1"
pendingManualGate: "main branch protection; Dependabot #372/#373 close-or-split; #368 defer; Actions PRs #367/#369/#370/#371 rebase independently"
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix PARTIAL"
  "295": "park — VS Code Marketplace unpublished (Option A)"
  "362": "scheduled — 6.26.0 outcome-aware behavioral sessions"
  "115": "park/close unless active ADPA partner"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "adoption-first 6.19→6.25 published"
remainingTrains:
  - "v6.25.1 critical correctness"
  - "v6.26.0 behavioral sessions"
  - "v6.27.0 bounded recovery"
  - "v6.28.0 Evidence binding"
  - "v6.29.0 usage/adapters"
  - "v6.30.0 conditional external conformance"
blockedTrains:
  - "retained-use adoption claim (BLOCKED_ON_EXTERNAL_EVIDENCE)"
  - "v7.0.0 (assessment only — docs/implementation/active/V7-READINESS-ASSESSMENT.md)"
updatedAt: "2026-09-12"
```
