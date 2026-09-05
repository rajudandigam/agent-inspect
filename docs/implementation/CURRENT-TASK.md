# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.18.0-safe-adoption
trainStatus: in-progress
currentChunk: phase2-publish-618
nextAction: "Fix pack:smoke preview assertion; run 6.18 release gate; merge Version Packages #350; Trusted Publish 6.18.0; then land #354 (6.19)"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: ""
```

## Published baseline

**6.17.8** (eighteen linked public packages). Persisted schema **1.0**. `origin/main` at `4a1cd87`.

## Active train — v6.18.0 safe adoption

Chunks on `main` (pending Version Packages):

| Chunk | Status |
| --- | --- |
| A same-output/wrong-path | done `#346` |
| B #307 / #213 packed E2E | done `#347` |
| C #311 preview parity | done `#353` |
| D+E #328/#329 residual + policy | done `#351` |
| F #330 errors-only tree | done `#348` |
| G capture-path docs | done `#349` |
| H #295 VS Code | deferred (Option A in `docs/VSCODE.md`) |

Blocker cleared by this branch: `pack:smoke` must assert preview is enabled (not `AI_ADAPTER_PREVIEW_NOT_AVAILABLE`).

## Later

- **6.19.0** — PR `#354` held until 6.18.0 publishes
- **6.20–6.22** — roadmap/labels only in this run

## Issue design state (no email gates)

- **#331** — design confirmed; existing APIs only; scheduled conditional **6.22**; not implemented
