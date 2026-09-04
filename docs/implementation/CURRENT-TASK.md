# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.17.7-redaction-dx-evidence
trainStatus: in-progress
currentChunk: chunk-2-observe-forbid-tool-dx
nextAction: "Chunk 3 — re-review and land #325; close #322 after merge; leave #326 open"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/EXECUTION-PLAN.md
pendingManualGate: ""
```

## Published baseline

**6.17.6** (eighteen linked public packages). Persisted schema **1.0**. Published via Changesets + `publish.yml` Trusted Publishing (`Version Packages` #318). Main includes search conjunctive fix (#323/#324) and P0 key-value redact (#327/#333).

## Active train — v6.17.7-redaction-dx-evidence

Redefined 6.17.7 content (not Studio/website/skill safety):

1. P0 high-confidence credential redactor/verifier alignment — **done** (#333)
2. DX truth — `observe()` docs + `check --forbid-tool` alias — **this chunk**
3. Land Evidence recipe #325 (Maulana primary; #322 reference-only)
4. Publish via Version Packages #326 Trusted Publishing

**Explicitly deferred from 6.17.7:** remote Studio / website / skill safety → later train (recorded in RELEASE-TRAIN-STATE; not implied shipped).

## Chunk 0–1 status

- State/roadmap/execution-plan updated for redefined 6.17.7 (#332)
- GitHub issues A–E opened (#327–#331); #327 closed by #333
- P0 redact parity on main (#333)
