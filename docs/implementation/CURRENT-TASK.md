# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.19.0-external-evidence
trainStatus: in-progress
currentChunk: 6.19.0-A-D-land-and-publish
nextAction: "Land #354 on main; Version Packages + Trusted Publish 6.19.0; close #355"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: ""
```

## Published baseline

**6.18.0** (linked public packages). Persisted schema **1.0**. `origin/main` at `ea4eecb` (Version Packages `#350`).

## Active train — v6.19.0 external evidence and failure semantics

| Chunk | Status |
| --- | --- |
| A custom TraceReader authoring | in `#354` |
| B DerivedFailureFact on TraceFacts | in `#354` |
| C architectural-intent interop | in `#354` |
| D priorContextReferences | in `#354` (docs) |
| Version Packages + Trusted Publish | pending after `#354` merges |

## Later

- **6.19.1** — reserved corrections only
- **6.20–6.22** — roadmap/labels only until 6.19 publishes

## Issue design state (no email gates)

- **#331** — design confirmed; existing APIs only; scheduled conditional **6.22**; not implemented
- **#355** — derived failure roles design note; close when `#354` ships and 6.19.0 publishes
