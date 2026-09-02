# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.17.5"
publishedVersion: "6.17.5"
targetVersion: "6.17.5"
currentTrain: "v6.17.5-feedback-integrity"
trainStatus: "release-pending"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-feedback-integrity-v6.17.5-to-v6.22"
branch: "main"
currentChunk: "6.17.5-release"
lastConfirmedCommit: "8c0e1e8"
lastValidationLevel: "full"
nextAction: "Merge Version Packages PR; Trusted Publishing publishes 6.17.5 and public-truth:sync updates README/docs"
pendingManualGate: "merge Version Packages PR for 6.17.5"
githubIssues:
  "308": "6.17.5 docs/tests + 6.20.0 requiredOrderMode — stay open"
  "309": "6.20.0 alternatives.anyOf — stay open"
  "310": "6.17.5 visible warning — closed"
  "311": "6.18.0 preview parity — stay open"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/EXECUTION-PLAN.md"
completedChunks:
  - "6.16.1 repository health"
  - "6.16.2 single-source docs"
  - "6.17.0 evidence UX"
  - "6.17.1 public proof (published)"
  - "6.17.3 / 6.17.4 package line published"
  - "6.17.5-0 … 6.17.5-17 (release integrity + check integrity + Phase A validation)"
remainingTrains:
  - "v6.17.5 publication (active)"
  - "v6.17.6 security containment"
  - "v6.18.0 adapter capture parity"
  - "v6.19.0 external persisted-source readers"
  - "v6.20.0 alternative valid contract paths + ordering modes"
  - "v6.21.0 actor-scoped contracts + outcome provenance"
  - "v6.22.0 conditional design-partner recipes"
blockedTrains:
  - "v6.18.0 publication (deferred until 6.17.5 lands and is reviewed)"
  - "v7.0.0 (conditional — assessment only; not scheduled)"
updatedAt: "2026-09-02"
```
