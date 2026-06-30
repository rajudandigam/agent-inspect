# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.3.0"
publishedVersion: "3.3.0"
currentTrain: "v3.4.0"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.3-publication-complete"
currentChunk: "v3.4-0-post-v3.3-reconciliation"
nextAction: "Execute v3.4 performance and reliability train."
pendingManualGate: "VS Code Marketplace first publish (extension code ready in packages/vscode)"
lastConfirmedCommit: "e010b35"
lastValidationLevel: "v3.3-publication-complete"
updatedAt: "2026-06-30"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Active plan:** [release-trains/V3.4.0-EXECUTION-PLAN.md](./release-trains/V3.4.0-EXECUTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.3.0-RELEASE-READINESS.md](./release-trains/V3.3.0-RELEASE-READINESS.md)
