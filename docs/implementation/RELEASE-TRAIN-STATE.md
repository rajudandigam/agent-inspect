# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.0"
publishedVersion: "3.5.0"
currentTrain: "post-v3.5-adoption"
trainStatus: "active"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5-publication-complete"
  - "v3-adoption-train-complete"
currentChunk: "adoption-polish-plan"
nextAction: "Execute adoption polish patches without new runtime product surface"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "1dd933f"
lastValidationLevel: "adoption-polish-plan"
updatedAt: "2026-06-30"
```

- **Polish plan:** [release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md](./release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.5.0-RELEASE-READINESS.md](./release-trains/V3.5.0-RELEASE-READINESS.md)
