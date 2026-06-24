# Release train state

> **This file is an operational pointer only.** Git state, package manifests, and tests are authoritative. Always run Phase 0 audit before acting on this file.

```yaml
baselineVersion: "1.4.0"
currentTrain: "v1.5.0"
currentChunk: 3
trainStatus: "in_progress"
branch: "main"
lastConfirmedCommit: "9305eda"
lastValidationLevel: "docs"
completedChunks: [1, 2, 3]
openBlockers: []
pendingManualGate: "B"
nextAction: "Review Chunk 3 (TRACE-VOCABULARY-V1.5.md), commit, begin Chunk 4 (what command)"
updatedAt: "2026-06-04T17:00:00.000Z"
```

## Chunk 3 — complete (pending Gate B commit)

**Deliverable:** [TRACE-VOCABULARY-V1.5.md](./proposals/TRACE-VOCABULARY-V1.5.md) + `fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl`
**Suggested commit:** `docs(v1.5): trace vocabulary RFC and token metadata decision`

## Next: Chunk 4

[`what` command](./release-trains/V1.5.0-EXECUTION-PLAN.md#chunk-4--what-command)

**Program:** [ROADMAP-EXECUTION-V1.5-TO-V2.md](./ROADMAP-EXECUTION-V1.5-TO-V2.md)
**Train plan:** [release-trains/V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)
