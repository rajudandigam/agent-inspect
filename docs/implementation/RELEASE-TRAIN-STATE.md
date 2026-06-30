# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.0"
publishedVersion: "3.5.1"
currentTrain: "post-v3.5-adoption"
trainStatus: "active"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5.1-adoption-polish"
  - "v3.5-publication-complete"
  - "v3-adoption-train-complete"
currentChunk: "v3.5.2-examples-visual"
nextAction: "Optional v3.5.2 docs/examples polish; no new runtime features"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "aa5435d"
lastValidationLevel: "v3.5.1-publish-complete"
updatedAt: "2026-06-30"
```

- **Polish plan:** [release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md](./release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md)
- **v3.5.1 readiness:** [release-trains/V3.5.1-ADOPTION-POLISH-RELEASE-READINESS.md](./release-trains/V3.5.1-ADOPTION-POLISH-RELEASE-READINESS.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
