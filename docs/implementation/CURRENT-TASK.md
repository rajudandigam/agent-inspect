# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.17.7-redaction-dx-evidence
trainStatus: in-progress
currentChunk: chunk-3-land-325
nextAction: "Chunk 4 — absorb Changesets into #326; Trusted Publish 6.17.7; Jan retest email draft"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/EXECUTION-PLAN.md
pendingManualGate: ""
```

## Published baseline

**6.17.6** (eighteen linked public packages). Persisted schema **1.0**. Published via Changesets + `publish.yml` Trusted Publishing (`Version Packages` #318). Main includes search conjunctive fix (#323/#324), P0 key-value redact (#333), and observe/forbid-tool DX (#334).

## Active train — v6.17.7-redaction-dx-evidence

Redefined 6.17.7 content (not Studio/website/skill safety):

1. P0 high-confidence credential redactor/verifier alignment — **done** (#333)
2. DX truth — `observe()` docs + `check --forbid-tool` alias — **done** (#334)
3. Land Evidence recipe #325 (Maulana primary; #322 reference-only) — **this chunk**
4. Publish via Version Packages #326 Trusted Publishing

**Explicitly deferred from 6.17.7:** remote Studio / website / skill safety → later train (recorded in RELEASE-TRAIN-STATE; not implied shipped).

## Chunk 0–2 status

- State/roadmap/execution-plan updated for redefined 6.17.7 (#332)
- GitHub issues A–E opened (#327–#331); #327 closed by #333; #330 opened (not implemented)
- P0 redact parity on main (#333)
- Observe docs + check `--forbid-tool` alias on main (#334)
