# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.0.0"
publishedVersion: "3.0.0"
currentTrain: "v3.1.0"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.0-publication-complete"
currentChunk: "v3.1-0-audit-current-package-state-and-publish-verification"
nextAction: "Execute v3.1 train: public harness, init, doctor, starter templates."
pendingManualGate: "first publication only for any package that is not yet public"
lastConfirmedCommit: "c9ff385"
lastValidationLevel: "v3.1-0-planning-reset"
updatedAt: "2026-06-29"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Architecture guide (historical):** [V2-TO-V3-ARCHITECTURE-GUIDE.md](./V2-TO-V3-ARCHITECTURE-GUIDE.md)
- **Active plan:** [release-trains/V3.1.0-EXECUTION-PLAN.md](./release-trains/V3.1.0-EXECUTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.0.0-RELEASE-READINESS.md](./release-trains/V3.0.0-RELEASE-READINESS.md)
- **Historical v3 contracts:** [V3-EXTENSION-CONTRACTS.md](../proposals/V3-EXTENSION-CONTRACTS.md)
