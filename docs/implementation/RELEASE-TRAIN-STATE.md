# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, and CI are authoritative.

```yaml
baselineVersion: "1.7.0"
publishedVersion: "1.7.0"
currentTrain: "v1.8.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "3fdbded83e318e0325d0751abe91d3d3dad2fed2"
lastValidationLevel: "jest-integration-chunk-gate"
completedChunks:
  - "v1.6.0-published"
  - "v1.7.0-published"
  - "v1.8-0-planning-reset"
  - "v1.8-1-ai-sdk-logical-event-identity"
  - "v1.8-2-ai-sdk-isolation-and-failure-lifecycle"
  - "v1.8-3-ai-sdk-capture-and-redaction-contract"
  - "v1.8-4-optional-package-tarball-smoke"
  - "v1.8-5-openai-agents-tracing-processor"
  - "v1.8-6-openai-agents-safety-and-recipes"
  - "v1.8-7-langgraph-through-langchain"
  - "v1.8-8-executable-adapter-conformance"
  - "v1.8-9-checks-rfc"
  - "v1.8-10-checks-subpath-and-engine"
  - "v1.8-11-run-tool-llm-checks"
  - "v1.8-12-structure-and-safety-rules"
  - "v1.8-13-check-cli-and-configuration"
  - "v1.8-14-baseline-regression"
  - "v1.8-15-scan-and-verify-safe"
  - "v1.8-16-safe-artifacts-and-github-summary"
  - "v1.8-17-vitest-integration"
  - "v1.8-18-jest-integration"
currentChunk: "v1.8-19-recipes-docs-performance"
pendingManualGate: "openai-agents-first-publication-at-release"
nextAction: "Execute v1.8 chunk 19: add deterministic CI recipes, update docs, and benchmark large traces/check execution"
publishedAt: "2026-06-26"
updatedAt: "2026-06-26"
```

**Active roadmap:** [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md)  
**Active plan:** [release-trains/V1.8.0-EXECUTION-PLAN.md](./release-trains/V1.8.0-EXECUTION-PLAN.md)  
**Architecture index:** [../proposals/README.md](../proposals/README.md)  
**Previous readiness:** [release-trains/V1.7.0-RELEASE-READINESS.md](./release-trains/V1.7.0-RELEASE-READINESS.md)
