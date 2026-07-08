# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.1.0"
publishedVersion: "4.1.0 (all 17 packages live on npm)"
currentTrain: "v4.2.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.5.5-readme-svg-fix"
  - "v3.5.6-planning-reset"
  - "v3.5.6-source-truth"
  - "v4.0-0-workspace-rfc"
  - "v4.0-1-workspace-manifest-model"
  - "v4.0-2-workspace-filesystem-helpers"
  - "v4.0-3-workspace-cli"
  - "v4.0-3-workspace-public-subpath-export"
  - "v4.0-4-workspace-docs-recipe"
  - "v4.0-5-release-readiness"
  - "v4.0.0-published (all 16 packages, tags created)"
  - "v4.1-0-optional-local-index-rfc"
  - "v4.1-1-index-sqlite-package-scaffold"
  - "v4.1-2-index-schema-builder-query"
  - "v4.1-3-index-sqlite-cli"
  - "v4.1-5-docs-and-release-readiness"
  - "v4.1.0-published (all 17 packages @ 4.1.0; index-sqlite manual first publish + Trusted Publishing)"
currentChunk: "v4.2-0 sessions and activity RFC refresh"
nextAction: "v4.2-1: session status model + extended SessionSummary aggregation in packages/core/src/sessions/"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "abfefa0"
lastPublishRun: "28974816310 + manual index-sqlite publish (all 17 @ 4.1.0 verified on npm)"
lastValidationLevel: "v4.1.0 full gate green; npm verify @agent-inspect/index-sqlite@4.1.0"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
