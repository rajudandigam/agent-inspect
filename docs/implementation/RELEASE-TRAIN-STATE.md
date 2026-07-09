# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "5.4.0"
publishedVersion: "5.4.0 (all 17 packages live on npm)"
currentTrain: "v6.0.0"
trainStatus: "planning"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v5.2.0-published (all 17 packages @ 5.2.0, CI run 28990000097)"
  - "v5.3.0-published (all 17 packages @ 5.3.0, CI run 28991868139)"
  - "v5.4.0-published (all 17 packages @ 5.4.0, CI run 28993299414)"
currentChunk: "v5.4.0 complete; next: v6.0.0 Self-hosted Studio"
nextAction: "v6.0-0 studio RFC per execution plan"
pendingManualGate: "VS Code Marketplace first publish; @agent-inspect/studio first publication"
lastConfirmedCommit: "9166cff"
lastPublishRun: "28993299414 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at 5.4.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v5.1 plan:** roadmap § v5.1.0 Cohort Analysis v2
