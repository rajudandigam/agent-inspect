# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative. Always run Phase 0 audit before acting on this file.

```yaml
baselineVersion: "1.4.0"
currentTrain: "v1.5.0"
currentChunk: 2
trainStatus: "in_progress"
branch: "main"
lastConfirmedCommit: "00d13b6"
lastValidationLevel: "export"
completedChunks: [1, 2]
openBlockers: []
pendingManualGate: "B"
nextAction: "Review Chunk 2 (subpath exports), commit, begin Chunk 3 (trace vocabulary RFC)"
updatedAt: "2026-06-04T16:30:00.000Z"
```

## Chunk 2 — complete (pending Gate B commit)

**Deliverable:** Non-breaking subpath exports (`./advanced`, `./persisted`, `./logs`, `./exporters`, `./diff`)
**Suggested commit:** `feat(v1.5): add non-breaking package subpath exports`

## Next: Chunk 3

[Trace vocabulary + schema decision](./release-trains/V1.5.0-EXECUTION-PLAN.md#chunk-3--trace-vocabulary--schema-decision)

**Program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
**Train plan:** [release-trains/V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)
