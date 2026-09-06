# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.18.0"
publishedVersion: "6.18.0"
currentTrain: "v6.18.0-safe-adoption"
trainStatus: "in-progress"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-feedback-integrity-v6.17.5-to-v6.22"
branch: "main"
currentChunk: "phase2-publish-618"
lastConfirmedCommit: "4a1cd87"
lastValidationLevel: "code-complete"
nextAction: "pack:smoke preview fix; 6.18 release gate; Version Packages #350; Trusted Publish 6.18.0"
pendingManualGate: ""
githubIssues:
  "209": "keep open — cross-platform packed-consumer matrix"
  "295": "6.18-H deferred — VS Code Option A recorded"
  "297": "deferred CONFLICTING — post-6.18 preflight"
  "306": "draft hold — superseded after #297"
  "308": "6.20 requiredOrderMode — stay open; PR #315"
  "309": "6.20 alternatives.anyOf — stay open"
  "311": "closed — preview parity shipped #353"
  "328": "closed — residual after redact #351"
  "329": "closed — bounded CLI policy #351"
  "330": "closed — errors-only tree #348"
  "331": "6.22 — design confirmed; existing APIs only; not implemented"
  "354": "6.19 PR held until 6.18.0 publishes"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/NEXT-RELEASES.md"
completedChunks:
  - "6.17.8 published (Version Packages #343)"
  - "6.18.0 A–H code on main (#346–#353)"
remainingTrains:
  - "v6.18.0 safe adoption (publish gate)"
  - "v6.18.1 reserved patch"
  - "v6.19.0 external evidence and derived failure semantics"
  - "v6.20.0 flexible deterministic contracts"
  - "v6.21.0 multi-agent evidence precision"
  - "v6.22.0 conditional design-partner recipes"
blockedTrains:
  - "v7.0.0 (conditional — assessment only; not scheduled)"
updatedAt: "2026-09-05"
```
