# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "6.4.0"
publishedVersion: "6.4.0"
currentTrain: "pre-v7-stabilization"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
currentChunk: "6.4.2"
nextAction: "Post-6.4.1 publish verification; skip v6.4.2 if no repair needed"
completedChunks:
  - "6.4.1-0 planning: baseline audit, execution plans v6.4.1–v6.8, train activation"
  - "6.4.1-1…11 trust/security patch implementation (changeset pending publish)"
lastConfirmedCommit: "548d0b9"
lastValidationLevel: "chunk-gate-green"
updatedAt: "2026-07-09"
```

## Quick links

- **Canonical roadmap:** [ROADMAP-V6.4-TO-PRE-V7.md](./ROADMAP-V6.4-TO-PRE-V7.md)
- **v6.4.1 readiness:** [V6.4.1-RELEASE-READINESS.md](./release-trains/V6.4.1-RELEASE-READINESS.md)
- **Active plan:** [V6.4.1-EXECUTION-PLAN.md](./release-trains/V6.4.1-EXECUTION-PLAN.md)
