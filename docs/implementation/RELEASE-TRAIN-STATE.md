# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, and CI are authoritative.

```yaml
baselineVersion: "1.7.0"
publishedVersion: "1.7.0"
currentTrain: "v1.8.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "7e738751624e2bb60b9001a9b7a643fb406b8180"
lastValidationLevel: "adapter-package-chunk-gate"
completedChunks:
  - "v1.6.0-published"
  - "v1.7.0-published"
  - "v1.8-0-planning-reset"
  - "v1.8-1-ai-sdk-logical-event-identity"
  - "v1.8-2-ai-sdk-isolation-and-failure-lifecycle"
  - "v1.8-3-ai-sdk-capture-and-redaction-contract"
currentChunk: "v1.8-4-optional-package-tarball-smoke"
pendingManualGate: "openai-agents-first-publication-at-release"
nextAction: "Execute v1.8 chunk 4: add packed install smoke for public optional packages across ESM, CJS, declarations, peers, and minimal runtime calls"
publishedAt: "2026-06-26"
updatedAt: "2026-06-26"
```

**Active roadmap:** [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md)  
**Active plan:** [release-trains/V1.8.0-EXECUTION-PLAN.md](./release-trains/V1.8.0-EXECUTION-PLAN.md)  
**Architecture index:** [../proposals/README.md](../proposals/README.md)  
**Previous readiness:** [release-trains/V1.7.0-RELEASE-READINESS.md](./release-trains/V1.7.0-RELEASE-READINESS.md)
