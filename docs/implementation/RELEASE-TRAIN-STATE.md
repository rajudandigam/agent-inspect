# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.2.0"
publishedVersion: "4.2.0 (all 17 packages live on npm)"
currentTrain: "v4.2.0"
trainStatus: "published"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v4.2-0-sessions-activity-rfc"
  - "v4.2-1-session-status-model"
  - "v4.2-2-activity-summaries"
  - "v4.2-3-cli-subcommands"
  - "v4.2-4-index-acceleration-parity"
  - "v4.2-5-docs-and-release-readiness"
  - "v4.2.0-published (all 17 packages @ 4.2.0, CI run 28978869529)"
currentTrain: "v4.3.0"
trainStatus: "planning"
currentChunk: "v4.2.0 complete; next: v4.3.0 Shareable Trace Bundles"
nextAction: "v4.3-0: shareable bundles RFC per V4.3.0-EXECUTION-PLAN.md"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "543e44d"
lastPublishRun: "28978869529 (workflow_dispatch, success; npm@11.18.0 OIDC fix)"
lastValidationLevel: "full gate green at 4.2.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v4.3 plan:** [release-trains/V4.3.0-EXECUTION-PLAN.md](./release-trains/V4.3.0-EXECUTION-PLAN.md)
