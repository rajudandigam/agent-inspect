# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.5"
publishedVersion: "3.5.5"
currentTrain: "v3.5.6"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.5.5-readme-svg-fix"
  - "v3.5.6-planning-reset"
  - "v3.5.6-source-truth"
  - "v4.0-0-workspace-rfc"
  - "v4.0-1-workspace-manifest-model"
currentChunk: "v4.0-1-workspace-manifest-model (complete)"
nextAction: "STOP at hard gate — v4.0-2 (workspace filesystem helpers) then v4.0-3 CLI add public surface; maintainer go-ahead required"
pendingManualGate: "v4.0 public surface (agent-inspect/workspace export + workspace CLI); VS Code Marketplace first publish (packages/vscode); first publication of any new public package (e.g. @agent-inspect/index-sqlite at v4.1)"
lastConfirmedCommit: "3f72794"
lastValidationLevel: "build+typecheck+test (1252 passing) + diff-check"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
