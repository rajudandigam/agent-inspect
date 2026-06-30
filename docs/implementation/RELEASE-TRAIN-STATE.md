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
  - "v3.4-1-performance-benchmarks"
  - "v3.4-2-performance-scale-docs"
  - "v3.4-3-large-directory-warnings"
  - "v3.4-4-index-cli"
  - "v3.4-5-stall-timeout-checks"
  - "v3.4-6-streaming-limitations-guide"
currentChunk: "v3.4-7-release-readiness"
nextAction: "Version Packages PR for 3.4.0."
pendingManualGate: "VS Code Marketplace first publish (extension in packages/vscode)"
lastConfirmedCommit: "f8605d7"
lastValidationLevel: "v3.4-release-prep"
updatedAt: "2026-06-30"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Active plan:** [release-trains/V3.4.0-EXECUTION-PLAN.md](./release-trains/V3.4.0-EXECUTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.4.0-RELEASE-READINESS.md](./release-trains/V3.4.0-RELEASE-READINESS.md)
