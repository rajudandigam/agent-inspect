# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "5.1.0"
publishedVersion: "5.1.0 (all 17 packages live on npm)"
currentTrain: "v5.2.0"
trainStatus: "planning"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v5.0-0-trace-suite-rfc"
  - "v5.0-1-config-loader-validator"
  - "v5.0-2-suite-run-engine"
  - "v5.0-3-suite-report"
  - "v5.0-4-suite-cli-commands"
  - "v5.0-5-recipes-docs-readiness"
  - "v5.0.0-published (all 17 packages @ 5.0.0, CI run 28986079661)"
  - "v5.1-0-cohort-rfc"
  - "v5.1-1-metric-engine"
  - "v5.1-2-grouping-engine"
  - "v5.1-3-baseline-candidate-comparison"
  - "v5.1-4-cohort-cli-reports"
  - "v5.1-5-fixtures-recipe-docs"
  - "v5.1.0-published (all 17 packages @ 5.1.0, CI run 28988054272)"
currentChunk: "v5.1.0 complete; next: v5.2.0 CI Quality Gates"
nextAction: "v5.2-0 per roadmap § v5.2.0"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "126fc25"
lastPublishRun: "28988054272 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at 5.1.0 + CI publish all 17 packages"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v5.1 plan:** roadmap § v5.1.0 Cohort Analysis v2
