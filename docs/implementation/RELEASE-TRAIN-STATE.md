# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.2"
publishedVersion: "3.5.3"
currentTrain: "post-v3.5-adoption"
trainStatus: "complete"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5.3-docs-hygiene"
  - "v3.5.2-demo-kit"
  - "v3.5.1-adoption-polish"
currentChunk: "adoption-handoff"
nextAction: "Design partner outreach; optional hero SVG when assets ready"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "64f6506"
lastValidationLevel: "v3.5.3-docs-cleanup"
updatedAt: "2026-06-30"
```

- **Hygiene readiness:** [release-trains/V3.5.3-ADOPTION-HYGIENE-RELEASE-READINESS.md](./release-trains/V3.5.3-ADOPTION-HYGIENE-RELEASE-READINESS.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
