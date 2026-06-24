# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative. Always run Phase 0 audit before acting on this file.

```yaml
baselineVersion: "1.4.0"
targetVersion: "1.5.0"
currentTrain: "v1.5.0"
currentChunk: 9
trainStatus: "ready_for_publish"
branch: "main"
lastConfirmedCommit: "5b1dfe1"
lastValidationLevel: "release-train"
completedChunks: [1, 2, 3, 4, 5, 6, 7, 8, 9]
openBlockers: []
pendingManualGate: "D"
nextAction: "Gate C review → changeset → version bump → npm publish (see V1.5.0-RELEASE-READINESS.md)"
updatedAt: "2026-06-04T18:20:00.000Z"
```

## v1.5.0 train — complete (pending Gate D publish)

All 9 chunks implemented. **Not published to npm yet.**

| Chunk | Suggested commit |
|-------|------------------|
| 7 | `refactor(core): canonical dual-format trace read path` |
| 8 | `refactor(cli): migrate inspection commands to shared read path` |
| 9 | `docs(v1.5): release readiness checklist and changelog draft` |

**Publish guide:** [V1.5.0-RELEASE-READINESS.md](./V1.5.0-RELEASE-READINESS.md)

## Next train

v1.6.0+ per [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md) — do not start until v1.5.0 is published.

**Program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
**Train plan:** [release-trains/V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)
