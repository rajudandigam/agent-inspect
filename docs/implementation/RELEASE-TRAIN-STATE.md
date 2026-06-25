# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative.

```yaml
baselineVersion: "1.6.0"
publishedVersion: "1.6.0"
currentTrain: "v1.7.0"
trainStatus: "planning"
branch: "main"
lastValidationLevel: "docs"
completedChunks:
  - "v1.5-internal-corrections"
  - "canonical-roadmap-reset"
  - "v1.6 memory-null-writers"
  - "v1.6 direct file writer"
  - "v1.6 buffered file writer"
  - "v1.6 composite writer"
  - "v1.6 runtime inspector contract"
  - "v1.6 createInspector API"
  - "v1.6 reader abstraction"
  - "v1.6 consolidated v0.1/v0.2 readers"
  - "H1-persisted-event-safety"
  - "H2 experimental API boundary cleanup"
  - "H3 reader fidelity, resolved input, and detection policy"
  - "chunk 9 OpenInference JSON reader"
  - "chunk 10 OTLP JSON reader"
  - "chunk 11 universal agent-inspect open"
  - "chunk 12 shared reader integration"
  - "chunk 13 recipes and documentation"
  - "chunk 14 release readiness"
  - "v1.6.0 published"
  - "v1.7 planning reset"
  - "v1.7 AI SDK telemetry RFC verification"
  - "v1.7 AI SDK package scaffold"
  - "v1.7 AI SDK metadata integration"
currentChunk: "v1.7-ai-sdk-tool-error-streaming"
pendingManualGate: "none"
nextAction: "Harden AI SDK tool, error, and streaming coverage with no-network fixtures"
publishedAt: "2026-06-25"
updatedAt: "2026-06-25"
```

**Active roadmap:** [ROADMAP-V1.7-TO-V3.md](./ROADMAP-V1.7-TO-V3.md)

**Architecture RFC index:** [../proposals/README.md](../proposals/README.md)

**Completed internal corrective plan:** [V1.5.1-PATCH-PLAN.md](./release-trains/V1.5.1-PATCH-PLAN.md)

**Canonical source archive:** [CANONICAL-ROADMAP-V1.6-TO-V3.md](./CANONICAL-ROADMAP-V1.6-TO-V3.md)

**Historical program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
