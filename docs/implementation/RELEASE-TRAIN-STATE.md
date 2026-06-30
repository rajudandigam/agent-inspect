# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.5.1"
publishedVersion: "3.5.2"
currentTrain: "post-v3.5-adoption"
trainStatus: "active"
executionMode: "adoption-freeze"
branch: "main"
completedChunks:
  - "v3.5.2-demo-kit"
  - "v3.5.1-adoption-polish"
  - "v3.5-publication-complete"
  - "v3-adoption-train-complete"
currentChunk: "v3.5.3-docs-hygiene"
nextAction: "Optional v3.5.3 final adoption kit (link audit, archive) — no runtime features"
pendingManualGate: "VS Code Marketplace first publish (packages/vscode)"
lastConfirmedCommit: "d9156b9"
lastValidationLevel: "v3.5.2-publish-complete"
updatedAt: "2026-06-30"
```

- **Polish plan:** [release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md](./release-trains/V3.5.X-ADOPTION-POLISH-PLAN.md)
- **Post-train:** [POST-V3.5-ADOPTION-PLAN.md](./POST-V3.5-ADOPTION-PLAN.md)
