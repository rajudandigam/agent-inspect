# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, and CI are authoritative.

```yaml
baselineVersion: "1.7.0"
publishedVersion: "1.7.0"
currentTrain: "v1.8.0"
trainStatus: "in_progress"
executionMode: "autonomous-release-train"
branch: "main"
lastConfirmedCommit: "beb342a4bd6048b0e725178d8b59ef98068bf35b"
lastValidationLevel: "run-tool-llm-checks-chunk-gate"
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
currentChunk: "v1.8-12-structure-and-safety-rules"
pendingManualGate: "openai-agents-first-publication-at-release"
nextAction: "Execute v1.8 chunk 12: implement structure and safety check rules for incomplete/orphan/cycle/relationship/parallel-width/retrieval/guardrail/decision signals plus deterministic redaction, prompt/output, sensitive-pattern, and oversized-attribute checks"
publishedAt: "2026-06-26"
updatedAt: "2026-06-26"
```

**Active roadmap:** [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md)  
**Active plan:** [release-trains/V1.8.0-EXECUTION-PLAN.md](./release-trains/V1.8.0-EXECUTION-PLAN.md)  
**Architecture index:** [../proposals/README.md](../proposals/README.md)  
**Previous readiness:** [release-trains/V1.7.0-RELEASE-READINESS.md](./release-trains/V1.7.0-RELEASE-READINESS.md)
