# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.

```yaml
baselineVersion: "3.1.0"
publishedVersion: "3.1.0"
currentTrain: "v3.2.0"
trainStatus: "active"
executionMode: "autonomous-release-train"
branch: "main"
completedChunks:
  - "v3.1-publication-complete"
  - "v3.2-0-post-v3.1-reconciliation"
  - "v3.2-1-ai-sdk-adapter-docs-hardening"
  - "v3.2-2-openai-agents-local-docs"
  - "v3.2-3-nestjs-harness-path"
  - "v3.2-4-mastra-rfc"
  - "v3.2-5-adapter-conformance-refresh"
currentChunk: "v3.2-6-release-readiness"
nextAction: "Version Packages PR for 3.2.0."
lastConfirmedCommit: "2a8804c"
lastValidationLevel: "v3.2-release-prep"
updatedAt: "2026-06-30"
```

- **Active roadmap:** [ROADMAP-V3.0-TO-V3.5.md](./ROADMAP-V3.0-TO-V3.5.md)
- **Active plan:** [release-trains/V3.2.0-EXECUTION-PLAN.md](./release-trains/V3.2.0-EXECUTION-PLAN.md)
- **Latest readiness:** [release-trains/V3.2.0-RELEASE-READINESS.md](./release-trains/V3.2.0-RELEASE-READINESS.md)
