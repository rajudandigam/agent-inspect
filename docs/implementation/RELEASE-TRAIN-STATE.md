# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.3.0"
publishedVersion: "pending publish"
currentTrain: "v4.3.0"
trainStatus: "ready-to-publish"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v4.3-0-shareable-bundles-rfc"
  - "v4.3-1-bundle-builder-core"
  - "v4.3-2-cli-bundle-command"
  - "v4.3-3-session-since-support"
  - "v4.3-4-offline-html-assets"
  - "v4.3-5-docs-recipe-release-readiness"
currentChunk: "v4.3.0 version bump complete; publish pending"
nextAction: "push main + workflow_dispatch publish; then v4.4.0 Observed Outcomes"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "8a21bce"
lastPublishRun: "28978869529 (v4.2.0 success)"
lastValidationLevel: "full gate green pre-4.3.0 version bump"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v4.3 plan:** [release-trains/V4.3.0-EXECUTION-PLAN.md](./release-trains/V4.3.0-EXECUTION-PLAN.md)
- **v4.4 plan:** roadmap § v4.4.0 Observed Outcomes
