# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.3"
publishedVersion: "3.5.5"
currentTrain: "post-v3.5-adoption"
trainStatus: "complete"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5.5-readme-svg-fix"
  - "v3.5.4-readme-polish"
  - "v3.5.3-docs-hygiene"
  - "v3.5.2-demo-kit"
  - "v3.5.1-adoption-polish"
currentChunk: "adoption-handoff"
nextAction: "Design partner outreach; Show HN when ready"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "edb5e6f"
lastValidationLevel: "v3.5.5-publish-complete"
updatedAt: "2026-07-05"
```

- **README review:** [reviews/README-ADOPTION-POLISH-REVIEW.md](./reviews/README-ADOPTION-POLISH-REVIEW.md)
- **Readiness:** [release-trains/V3.5.4-README-POLISH-READINESS.md](./release-trains/V3.5.4-README-POLISH-READINESS.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
