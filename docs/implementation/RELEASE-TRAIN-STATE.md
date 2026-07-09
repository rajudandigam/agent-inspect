# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "5.2.0"
publishedVersion: "5.2.0 (all 17 packages live on npm)"
currentTrain: "v5.3.0"
trainStatus: "planning"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v5.1.0-published (all 17 packages @ 5.1.0, CI run 28988054272)"
  - "v5.2-0-gate-rfc"
  - "v5.2-1-gate-engine"
  - "v5.2-2-gate-cli-exit-codes"
  - "v5.2-3-gate-output-renderers"
  - "v5.2-4-github-actions-recipe"
  - "v5.2-5-docs-readiness"
  - "v5.2.0-published (all 17 packages @ 5.2.0, CI run 28990000097)"
currentChunk: "v5.2.0 complete; next: v5.3.0 Suite Viewer"
nextAction: "v5.3-0 per roadmap § v5.3.0"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "8cfaa34"
lastPublishRun: "28990000097 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at 5.2.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v5.1 plan:** roadmap § v5.1.0 Cohort Analysis v2
