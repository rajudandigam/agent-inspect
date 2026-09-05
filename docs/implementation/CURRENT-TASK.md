# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.17.8-closeout-trust
trainStatus: in-progress
currentChunk: phase0-roadmap-truth
nextAction: "Land #340 clean --keep; then MCP untrusted-trace boundary; publish 6.17.8"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: ""
```

## Published baseline

**6.17.7** (eighteen linked public packages). Persisted schema **1.0**. `origin/main` at `1b5351c`.

## Active train — v6.17.8 closeout + trust-boundary

1. Land #340 strict `clean --keep` validation
2. Untrusted-trace MCP `instructions` + tool warnings + adversarial tests
3. Close completed issues (#67/#164/#165/#222) when acceptance confirmed
4. Attempt #297/#306; defer to 6.18 preflight if not clean
5. Trusted Publish 6.17.8 via Changesets

## Later (authorized after 6.17.8)

- **6.18.0** — differentiation starter, #307/#213, #311 preview, #328/#329, #330, capture-path docs, #295 scope
- **6.19.0** — TraceReader authoring, derived failure roles, architectural-intent interop, prior-context refs
- **6.20–6.22** — roadmap/labels only in this run

## Issue design state (no email gates)

- **#331** — design confirmed; existing APIs only; scheduled conditional **6.22**; not implemented
