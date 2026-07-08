# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.5"
publishedVersion: "3.5.5"
currentTrain: "v4.0.0"
trainStatus: "release-pending-npm-auth"
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
currentChunk: "v4.0.0 implementation complete; version bump staged"
nextAction: "changeset version -> 4.0.0, commit 'Version Packages'; publish requires authenticated npm (npm login) then changeset publish"
pendingManualGate: "npm authentication for changeset publish; VS Code Marketplace first publish (packages/vscode); first publication of any new public package (e.g. @agent-inspect/index-sqlite at v4.1)"
lastConfirmedCommit: "5f8cd61"
lastValidationLevel: "full gate — build+typecheck+test (1274 passing)+size+fixtures+recipes+compat:smoke+pack:smoke+npm pack dry-run+diff-check"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
