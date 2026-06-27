# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, and CI are authoritative.

```yaml
baselineVersion: "1.9.0"
publishedVersion: "1.9.0-partial-openai-agents-1.8.0"
currentTrain: "v2.0.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "99f5a1b7e14d6e4181e2e0255febf9608d67aa25"
lastValidationLevel: "v2.0-7-local-release-readiness-green"
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
  - "v1.8-19-recipes-docs-performance"
  - "v1.8-20-release-readiness"
  - "v1.8-21-first-openai-package-publication-and-linked-release"
  - "v1.8.1-1-docs-roadmap-maintainer-cleanup"
  - "v1.9-0-train-setup"
  - "v1.9-1-harness-package-boundary-and-core-runner"
  - "v1.9-2-harness-cli-ergonomics-and-recipes"
  - "v1.9-3-explain-dry-run-and-deterministic-local-explanation"
  - "v1.9-4-explain-provider-design-gate"
  - "v1.9-5-adapter-promotion"
  - "v1.9-6-root-api-slimming-plan-and-enforcement"
  - "v1.9-7-release-readiness"
  - "v1.9-release-prep-and-partial-publication"
  - "v2.0-0-train-setup-and-v1.9-publication-reconciliation"
  - "v2.0-1-contract-inventory-and-schema-1.0-freeze"
  - "v2.0-2-schema-1.0-model-validator-and-fixtures"
  - "v2.0-3-schema-1.0-writer-read-path"
  - "v2.0-4-migration-dry-run-cli"
  - "v2.0-5-v2-root-api-contract"
  - "v2.0-6-docs-and-migration-guide-alignment"
currentChunk: "v2.0-7-release-readiness"
pendingManualGate: "v2.0-release-authorization"
nextAction: "Commit and push v2.0 chunk 7 readiness evidence, wait for CI/Publish, then stop for maintainer release authorization before any versioning, changesets, tags, npm publish, or GitHub release."
publishedAt: "2026-06-27"
updatedAt: "2026-06-27"
```

- **Active roadmap:** [ROADMAP-V1.8.1-TO-V3.md](./ROADMAP-V1.8.1-TO-V3.md)
- **Active plan:** [release-trains/V2.0.0-EXECUTION-PLAN.md](./release-trains/V2.0.0-EXECUTION-PLAN.md)
- **Current readiness:** [release-trains/V2.0.0-RELEASE-READINESS.md](./release-trains/V2.0.0-RELEASE-READINESS.md)
- **Architecture index:** [../proposals/README.md](../proposals/README.md)
- **Previous readiness:** [release-trains/V1.8.0-RELEASE-READINESS.md](./release-trains/V1.8.0-RELEASE-READINESS.md)
