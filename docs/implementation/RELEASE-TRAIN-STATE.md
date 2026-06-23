# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative. Always run Phase 0 audit before acting on this file.

```yaml
baselineVersion: "1.4.0"
currentTrain: "v1.5.0"
currentChunk: 1
trainStatus: "in_progress"
branch: "main"
lastConfirmedCommit: "00d13b6"
lastValidationLevel: "docs"
completedChunks: [1]
openBlockers: []
pendingManualGate: "B"
nextAction: "Review Chunk 1 (API-BOUNDARY-V1.5.md), commit, begin Chunk 2 (subpath exports)"
updatedAt: "2026-06-04T12:00:00.000Z"
```

## Gate A — complete

- Planning docs committed: `00d13b6` — `docs: align execution roadmap through v2`
- Branch: `main` (confirmed — no train branch)

## Chunk 1 — complete (pending Gate B commit)

**Deliverable:** [API-BOUNDARY-V1.5.md](./API-BOUNDARY-V1.5.md) — full export inventory + subpath design
**Suggested commit:** `docs(v1.5): inventory root exports and subpath boundary design`

## Next: Chunk 2

[Non-breaking subpath exports](./release-trains/V1.5.0-EXECUTION-PLAN.md#chunk-2--non-breaking-subpath-exports) — implement `package.json` exports map per API-BOUNDARY-V1.5.md §4.

**Program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
**Train plan:** [release-trains/V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)
