# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.4.0"
publishedVersion: "3.4.0"
currentTrain: "v3.5.0"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.4-publication-complete"
  - "v3.5-1-adoption-docs"
  - "v3.5-2-demo-scripts"
  - "v3.5-3-starter-polish"
  - "v3.5-4-comparison-refresh"
  - "v3.5-5-design-partner-kit"
  - "v3.5-7-post-v3.5-handoff"
currentChunk: "v3.5-6-release-readiness"
nextAction: "Version Packages PR for 3.5.0."
pendingManualGate: "VS Code Marketplace first publish (deferred)"
lastConfirmedCommit: "af530f2"
lastValidationLevel: "v3.5-release-prep"
updatedAt: "2026-06-30"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Active plan:** [release-trains/V3.5.0-EXECUTION-PLAN.md](./release-trains/V3.5.0-EXECUTION-PLAN.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.5.0-RELEASE-READINESS.md](./release-trains/V3.5.0-RELEASE-READINESS.md)
