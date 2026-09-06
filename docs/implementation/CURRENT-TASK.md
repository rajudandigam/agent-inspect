# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.20.0-flexible-contracts
trainStatus: ready
currentChunk: authorize-620-implementation
nextAction: "Authorize and implement 6.20.0 (#308/#315 requiredOrderMode; #309 alternatives.anyOf) — no premature coding without maintainer go-ahead"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: ""
```

## Published baseline

**6.19.0** published on npm (`agent-inspect@6.19.0`, Trusted Publish run `34013658849`). Version Packages `#357` (`4e0d794`). Prior published: **6.17.8**, **6.18.0**. Persisted schema **1.0**.

## Active train — v6.20.0 flexible deterministic contracts

| Chunk | Status |
| --- | --- |
| Phase 4 roadmap/label hygiene | done (`#358`) |
| `requiredOrderMode` (#308 / PR #315) | scheduled 6.20 — await authorization |
| `alternatives.anyOf` (#309) | scheduled 6.20 — await authorization |

## Later

- **6.19.1** — reserved corrections only
- **6.21.0** — #320 actor scope; #321 outcome provenance (roadmap-next)
- **6.22.0** — #331 design confirmed; conditional; existing APIs only; not implemented (roadmap-future)

## Issue design state

- **#308 / #315 / #309** — scheduled **6.20**; labels → `roadmap-now`
- **#320 / #321** — scheduled **6.21**; labels → `roadmap-next`
- **#331** — design confirmed; conditional **6.22**; existing APIs only; not implemented; stays `roadmap-future`
- **#355** — closed (6.19.0 derived failure roles shipped in `#354`, published on npm)
