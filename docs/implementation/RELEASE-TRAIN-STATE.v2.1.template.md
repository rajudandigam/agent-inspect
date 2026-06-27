# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "2.0.0"
publishedVersion: "2.0.0"
currentTrain: "v2.1.0"
trainStatus: "planning"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "<fill with git rev-parse HEAD after v2 reconciliation>"
lastValidationLevel: "post-publish-docs"
completedChunks:
  - "v2.0.0-published"
currentChunk: "v2.1-post-v2-reconciliation"
pendingManualGate: "none"
nextAction: "Reconcile v2.0 post-publish docs and prepare v2.1 utility-triangle execution plan before runtime work"
publishedAt: "2026-06-27"
updatedAt: "2026-06-27"
```

- **Active roadmap:** [ROADMAP-V2.1-TO-V3.md](./ROADMAP-V2.1-TO-V3.md)
- **Active plan:** [release-trains/V2.1.0-EXECUTION-PLAN.md](./release-trains/V2.1.0-EXECUTION-PLAN.md)
- **Previous readiness:** [release-trains/V2.0.0-RELEASE-READINESS.md](./release-trains/V2.0.0-RELEASE-READINESS.md)
