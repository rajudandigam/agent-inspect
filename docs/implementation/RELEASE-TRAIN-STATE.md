# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.2"
publishedVersion: "3.5.2"
currentTrain: "post-v3.5-adoption"
trainStatus: "active"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5.2-demo-kit"
  - "v3.5.1-adoption-polish"
currentChunk: "v3.5.3-docs-hygiene"
nextAction: "Merge Version Packages PR for 3.5.3 when CI green"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "pending"
lastValidationLevel: "v3.5.3-docs-hygiene"
updatedAt: "2026-06-30"
```

- **Hygiene readiness:** [release-trains/V3.5.3-ADOPTION-HYGIENE-RELEASE-READINESS.md](./release-trains/V3.5.3-ADOPTION-HYGIENE-RELEASE-READINESS.md)
- **Polish plan:** [release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md](./release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md)
