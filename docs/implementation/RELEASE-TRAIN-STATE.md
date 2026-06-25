# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative.

```yaml
baselineVersion: "1.5.0"
publishedVersion: "1.5.0"
currentTrain: "v1.6.0"
trainStatus: "in_progress"
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
currentChunk: "H1-persisted-event-safety"
pendingManualGate: "manual release confirmation before any changeset/version/publish"
nextAction: "Execute H1 persisted-event safety before OpenInference; update CURRENT-TASK.md for H2 after validation"
publishedAt: "2026-06-24"
updatedAt: "2026-06-25"
```

**Active roadmap:** [ROADMAP-V1.6-TO-V3.md](./ROADMAP-V1.6-TO-V3.md)

**Architecture RFC index:** [../proposals/README.md](../proposals/README.md)

**Completed internal corrective plan:** [V1.5.1-PATCH-PLAN.md](./release-trains/V1.5.1-PATCH-PLAN.md)

**Canonical source archive:** [CANONICAL-ROADMAP-V1.6-TO-V3.md](./CANONICAL-ROADMAP-V1.6-TO-V3.md)

**Historical program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
