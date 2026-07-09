# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.4.0"
publishedVersion: "4.4.0 (all 17 packages live on npm)"
currentTrain: "v4.4.0"
trainStatus: "published"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v4.4-0-observed-outcomes-rfc"
  - "v4.4-1-outcome-types-helpers"
  - "v4.4-2-observe-outcome-api"
  - "v4.4-3-report-check-search-cli"
  - "v4.4-4-fixtures-recipe-docs"
  - "v4.4-5-validate-version-publish"
  - "v4.4.0-published (all 17 packages @ 4.4.0, CI run 28984913102)"
currentTrain: "v5.0.0"
trainStatus: "planning"
currentChunk: "v4.4.0 complete; next: v5.0.0 Trace Suite Config"
nextAction: "v5.0-0: trace suite config RFC per roadmap § v5.0.0"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "1a679e3"
lastPublishRun: "28984913102 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at 4.4.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v5.0 plan:** roadmap § v5.0.0 Trace Suite Config
