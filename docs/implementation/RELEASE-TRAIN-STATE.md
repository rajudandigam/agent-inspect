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
  - "v3.5.4-readme-polish"
  - "v3.5.3-docs-hygiene"
  - "v3.5.2-demo-kit"
  - "v3.5.1-adoption-polish"
currentChunk: "v3.5.6-source-truth-and-v4-planning"
nextAction: "Complete v3.5.6 source-of-truth cleanup, then begin v4.0 (workspace RFC + internal manifest model); stop at first hard gate"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode); first publication of any new public package (e.g. @agent-inspect/index-sqlite at v4.1)"
lastConfirmedCommit: "a5293a0"
lastValidationLevel: "docs-planning"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v3.5.6 + v4 planning:** [release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md](./release-trains/V3.5.6-SOURCE-TRUTH-AND-V4-PLANNING.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
