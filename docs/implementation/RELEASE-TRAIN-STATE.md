# Release train state

> Operational pointer only. Git state, package manifests, tests, npm, tags, GitHub releases, and CI are authoritative.
>
> **Canonical roadmap:** [ROADMAP.md](./ROADMAP.md)

```yaml
baselineVersion: "6.17.7"
publishedVersion: "6.17.7"
currentTrain: "v6.17.8-queue-health"
trainStatus: "pending-start"
executionMode: "maintainer-reviewed"
namedTrain: "agentinspect-feedback-integrity-v6.17.5-to-v6.22"
branch: "main"
currentChunk: "post-6177-handoff"
lastConfirmedCommit: "e0a7014"
lastValidationLevel: "version-packages-merged"
nextAction: "Confirm Trusted Publish npm 6.17.7; Jan sends retest email; start 6.17.8 queue health"
pendingManualGate: "Jan retest email (docs/implementation/active/JAN-RETEST-EMAIL-DRAFT.md)"
githubIssues:
  "211": "closed — API surface snapshot done"
  "225": "closed — no-egress harness done"
  "308": "6.20.0 requiredOrderMode — labeled roadmap-future; PR #315 REQUEST CHANGES"
  "309": "6.20.0 alternatives.anyOf — labeled roadmap-future"
  "310": "closed"
  "311": "6.18.0 preview parity — labeled roadmap-next"
  "316": "closed — Evidence recipe landed via #335"
  "323": "closed — search conjunctive filters on main"
  "327": "closed — P0 redact/verify-safe key-value credential alignment (#333)"
  "328": "proposal — residual safety after standalone redact (issue B)"
  "329": "proposal — bounded local CLI custom redaction policy (issue C)"
  "330": "enhancement — view --errors-only pruned error tree (issue D; opened, not implemented in 6.17.7)"
  "331": "recipe — guardrail refusal evidence after Patrick confirms (issue E)"
canonicalRoadmap: "docs/implementation/ROADMAP.md"
activePlan: "docs/implementation/active/EXECUTION-PLAN.md"
completedChunks:
  - "6.17.5 published (Trusted Publishing #317)"
  - "6.17.6 security containment published (Version Packages #318)"
  - "6.17.6 search conjunctive fix (#323/#324) on main"
  - "6.17.7-0-authorize (#332)"
  - "6.17.7-1-p0-key-value-redact (#333)"
  - "6.17.7-2-observe-forbid-tool-dx (#334)"
  - "6.17.7-3-land-325 (#335)"
  - "6.17.7-4-publish Version Packages (#326)"
remainingTrains:
  - "v6.17.7b deferred — remote Studio / website / skill safety (explicit deferral from redefined 6.17.7)"
  - "v6.17.8 workflows / scanners / SECURITY.md / contributor queue (next)"
  - "v6.18.0 adapter capture parity"
  - "v6.19.0 external persisted-source readers"
  - "v6.20.0 alternative valid contract paths + ordering modes"
  - "v6.21.0 actor-scoped contracts + outcome provenance"
  - "v6.22.0 conditional design-partner recipes"
blockedTrains:
  - "v7.0.0 (conditional — assessment only; not scheduled)"
deferredFrom6177:
  - "remote Studio / website / skill safety — deferred 2026-09-04; not shipped in 6.17.7 patch content"
updatedAt: "2026-09-04"
```
