# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.3.0"
publishedVersion: "4.3.0 (all 17 packages live on npm)"
currentTrain: "v4.3.0"
trainStatus: "published"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v4.3-0-shareable-bundles-rfc"
  - "v4.3-1-bundle-builder-core"
  - "v4.3-2-cli-bundle-command"
  - "v4.3-3-session-since-support"
  - "v4.3-4-offline-html-assets"
  - "v4.3-5-docs-recipe-release-readiness"
  - "v4.3.0-published (all 17 packages @ 4.3.0, CI run 28982956122)"
currentTrain: "v4.4.0"
trainStatus: "planning"
currentChunk: "v4.3.0 complete; next: v4.4.0 Observed Outcomes"
nextAction: "v4.4-0: observed outcomes RFC per roadmap § v4.4.0"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "3d5f673"
lastPublishRun: "28982956122 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at 4.3.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v4.4 plan:** roadmap § v4.4.0 Observed Outcomes
