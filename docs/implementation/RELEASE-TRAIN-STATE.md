# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.17.2"
publishedVersion: "6.17.2"
currentTrain: "v6.18.0-niche-launch"
trainStatus: "stopped-before-changeset"
executionMode: "autonomous-release-train"
namedTrain: "agentinspect-repository-health-evidence-ux-v6.16-to-pre-v7"
branch: "main"
currentChunk: "6.18.0-external-gate"
lastConfirmedCommit: "7ea3190"
lastValidationLevel: "release"
nextAction: "External acceptance missing — no 6.18.0 Changeset; maintenance until gate file is satisfied"
pendingManualGate: "docs/implementation/active/EXTERNAL-ACCEPTANCE-GATE.md"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/EXECUTION-PLAN.md"
completedChunks:
  - "6.16.1 repository health"
  - "6.16.2 single-source docs"
  - "6.17.0 evidence UX"
  - "6.17.1 public proof (published)"
remainingTrains:
  - "v6.18.0 niche launch (blocked on external acceptance)"
  - "v6.18.x maintenance"
blockedTrains:
  - "v6.18.0 publication (external acceptance missing)"
  - "v7.0.0 (conditional — assessment only; not scheduled)"
updatedAt: "2026-08-12"
```
