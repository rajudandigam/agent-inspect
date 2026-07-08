# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.0.0"
publishedVersion: "4.0.0"
currentTrain: "v4.1.0"
trainStatus: "release-pending-first-publication-gate"
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
currentChunk: "v4.1.0 implemented + validated + versioned (4.1.0); awaiting first-publication gate for new @agent-inspect/index-sqlite"
nextAction: "Configure npm Trusted Publisher for @agent-inspect/index-sqlite (owner rajudandigam, repo agent-inspect, workflow publish.yml), then let publish.yml publish 4.1.0 for all 17 packages. Existing 16 already have Trusted Publishing."
pendingManualGate: "HARD STOP: first publication of new @agent-inspect/index-sqlite requires npm Trusted Publisher config (OIDC) before CI publish; without it changeset publish returns E404 for that package. VS Code Marketplace first publish (packages/vscode) also outstanding."
lastConfirmedCommit: "9207820"
lastPublishRun: "28970942944 (v4.0.0 workflow_dispatch, success 10m38s)"
lastValidationLevel: "full gate green at 4.1.0 (build, typecheck, test 1285, coverage, fixtures, recipes, perf:baseline, size, pack:smoke, compat:smoke, npm pack --dry-run, diff-check)"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
