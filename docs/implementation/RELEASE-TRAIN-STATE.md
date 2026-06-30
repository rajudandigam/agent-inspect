# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.0"
publishedVersion: "3.5.0"
currentTrain: "post-v3.5-adoption"
trainStatus: "complete"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5-publication-complete"
  - "v3-adoption-train-complete"
currentChunk: "post-v3.5-adoption-freeze"
nextAction: "Execute POST-V3.5-ADOPTION-PLAN.md — design partners, demos, docs fixes only."
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "pending-publication-doc"
lastValidationLevel: "v3.5-publication-complete"
updatedAt: "2026-06-30"
```

- **Roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md) (complete)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.5.0-RELEASE-READINESS.md](./release-trains/V3.5.0-RELEASE-READINESS.md)
