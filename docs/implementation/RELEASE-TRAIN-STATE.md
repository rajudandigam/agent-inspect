# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.19.0"
publishedVersion: "6.18.0"  # 6.19.0 Version Packages merged; confirm npm
currentTrain: "v6.20.0-flexible-contracts"
trainStatus: "ready"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-feedback-integrity-v6.17.5-to-v6.22"
branch: "main"
currentChunk: "phase4-620-622-roadmap-label-hygiene"
lastConfirmedCommit: "4e0d794"
lastValidationLevel: "version-packages-357-merged-publish-pending"
nextAction: "Merge Phase 4 docs/labels PR; then authorize 6.20.0 implementation (#308/#315/#309)"
pendingManualGate: ""
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix"
  "295": "6.18-H deferred — VS Code Option A recorded"
  "297": "deferred CONFLICTING — post-6.18 preflight"
  "306": "draft hold — superseded after #297"
  "308": "6.20 requiredOrderMode — roadmap-now; stay open; PR #315"
  "309": "6.20 alternatives.anyOf — roadmap-now; stay open"
  "315": "6.20 PR — causal requiredOrder modes; keep open until train"
  "320": "6.21 actor-scoped contracts — roadmap-next; stay open"
  "321": "6.21 outcome provenance — roadmap-next; stay open"
  "331": "6.22 — design confirmed; existing APIs only; not implemented; roadmap-future"
  "354": "6.19 PR — merged"
  "355": "6.19 derived failure design note — close after npm confirms 6.19.0"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.17.8 published (Version Packages #343)"
  - "6.18.0 A–H code + Version Packages #350 + Trusted Publish"
  - "6.19.0 A–D (#354) + Version Packages #357"
remainingTrains:
  - "v6.19.1 reserved patch"
  - "v6.20.0 flexible deterministic contracts"
  - "v6.21.0 multi-agent evidence precision"
  - "v6.22.0 conditional design-partner recipes"
blockedTrains:
  - "v7.0.0 (conditional — assessment only; not scheduled)"
updatedAt: "2026-09-06"
```
