# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "4.1.0"
publishedVersion: "4.1.0 (all 17 packages live on npm)"
currentTrain: "v4.2.0"
trainStatus: "release-pending-publish"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v4.1.0-published (all 17 packages @ 4.1.0)"
  - "v4.2-0-sessions-activity-rfc"
  - "v4.2-1-session-status-model"
  - "v4.2-2-activity-summaries"
  - "v4.2-3-cli-subcommands"
  - "v4.2-4-index-acceleration-parity"
  - "v4.2-5-docs-and-release-readiness"
currentChunk: "v4.2.0 versioned (4.2.0); awaiting CI publish"
nextAction: "Push Version Packages commit; verify publish.yml publishes all 17 @ 4.2.0"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "950db1d"
lastValidationLevel: "full gate green at 4.2.0 (build, typecheck, test 1301, coverage, fixtures, recipes, perf:baseline, size, pack:smoke, compat:smoke, diff-check)"
updatedAt: "2026-07-08"
```

- **Canonical roadmap:** [ROADMAP_V3_5_TO_V7.md](./ROADMAP_V3_5_TO_V7.md)
- **v4-v7 execution plans:** [release-trains/README.md](./release-trains/README.md)
