# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative.

```yaml
baselineVersion: "1.5.0"
publishedVersion: "1.5.0"
currentTrain: "v1.5.1"
trainStatus: "ready_for_review"
branch: "main"
lastValidationLevel: "release-readiness"
completedChunks: [1, 2, 3, 4]
currentChunk: null
pendingManualGate: "Gate C maintainer review"
nextAction: "Review the complete v1.5.1 patch train; only after explicit Gate D authorization create a changeset/version bump/publish/tag; do not start v1.6"
publishedAt: "2026-06-24"
updatedAt: "2026-06-24"
```

**Active patch plan:** [V1.5.1-PATCH-PLAN.md](./release-trains/V1.5.1-PATCH-PLAN.md)

**Future canonical input (inactive until v1.5.1 publication):** [CANONICAL-ROADMAP-V1.6-TO-V3.md](./CANONICAL-ROADMAP-V1.6-TO-V3.md)

**Historical program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
