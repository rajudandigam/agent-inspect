# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, and CI are authoritative.

```yaml
baselineVersion: "1.7.0"
publishedVersion: "1.7.0"
currentTrain: "v1.8.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "<replace-with-git-rev-parse-HEAD>"
lastValidationLevel: "v1.7-post-publish"
completedChunks:
  - "v1.6.0-published"
  - "v1.7.0-published"
currentChunk: "v1.8-0-planning-reset"
pendingManualGate: "openai-agents-first-publication-at-release"
nextAction: "Execute CURRENT-TASK.md and continue through the ordered v1.8 execution plan"
publishedAt: "2026-06-26"
updatedAt: "<current-date>"
```

**Active roadmap:** [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md)  
**Active plan:** [release-trains/V1.8.0-EXECUTION-PLAN.md](./release-trains/V1.8.0-EXECUTION-PLAN.md)  
**Architecture index:** [../proposals/README.md](../proposals/README.md)  
**Previous readiness:** [release-trains/V1.7.0-RELEASE-READINESS.md](./release-trains/V1.7.0-RELEASE-READINESS.md)
