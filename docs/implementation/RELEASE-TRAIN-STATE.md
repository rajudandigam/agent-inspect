# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.0.0"
publishedVersion: "4.0.0"
currentTrain: "v4.1.0"
trainStatus: "planning"
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
currentChunk: "v4.0.0 published; starting v4.1.0 (Optional Local Index)"
nextAction: "v4.1.0: new @agent-inspect/index-sqlite package (SQLite index) — maintainer approved; confirm SQLite driver + Trusted Publisher for new package"
pendingManualGate: "npmjs.com Trusted Publisher config for new @agent-inspect/index-sqlite package (OIDC) before CI can publish it; VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "4321760"
lastPublishRun: "28970942944 (workflow_dispatch, success 10m38s)"
lastValidationLevel: "full gate + CI Trusted Publishing (all 16 @ 4.0.0 live on npm)"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
