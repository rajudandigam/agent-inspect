# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative.

```yaml
baselineVersion: "1.5.0"
publishedVersion: "1.5.0"
currentTrain: "v1.5.1"
trainStatus: "in_progress"
branch: "main"
lastValidationLevel: "runtime"
completedChunks: [1, 2]
currentChunk: 3
pendingManualGate: "Chunk 3 validation: pnpm pack:smoke was blocked before execution by the Codex usage limit"
nextAction: "Run pnpm pack:smoke; if green, review and commit Chunk 3 before authorizing Chunk 4; do not start v1.6"
publishedAt: "2026-06-24"
updatedAt: "2026-06-24"
```

**Active patch plan:** [V1.5.1-PATCH-PLAN.md](./release-trains/V1.5.1-PATCH-PLAN.md)

**Future canonical input (inactive until v1.5.1 publication):** [CANONICAL-ROADMAP-V1.6-TO-V3.md](./CANONICAL-ROADMAP-V1.6-TO-V3.md)

**Historical program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
