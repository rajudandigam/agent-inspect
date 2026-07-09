# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "5.1.0"
publishedVersion: "5.1.0 (all 17 packages live on npm)"
currentTrain: "v5.2.0"
trainStatus: "validating"
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
currentChunk: "v5.2.0 version + publish"
nextAction: "changeset version to 5.2.0, push, workflow_dispatch publish"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "1173106"
lastPublishRun: "28988054272 (workflow_dispatch, success)"
lastValidationLevel: "full gate green at v5.2.0 implementation"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v5.1 plan:** roadmap § v5.1.0 Cohort Analysis v2
