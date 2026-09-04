# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.17.7-redaction-dx-evidence
trainStatus: in-progress
currentChunk: chunk-0-authorize
nextAction: "Chunk 1 — P0 high-confidence key-value credential redaction parity (issue A); leave Version Packages #326 open until P0 + DX + #325 land"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/EXECUTION-PLAN.md
pendingManualGate: ""
```

## Published baseline

**6.17.6** (eighteen linked public packages). Persisted schema **1.0**. Published via Changesets + `publish.yml` Trusted Publishing (`Version Packages` #318). Main includes search conjunctive fix (#323/#324) at `0f4ada3`.

## Active train — v6.17.7-redaction-dx-evidence

Redefined 6.17.7 content (not Studio/website/skill safety):

1. P0 high-confidence credential redactor/verifier alignment
2. DX truth — `observe()` docs + `check --forbid-tool` alias
3. Land Evidence recipe #325 (Maulana primary; #322 reference-only)
4. Publish via Version Packages #326 Trusted Publishing

**Explicitly deferred from 6.17.7:** remote Studio / website / skill safety → later train (recorded in RELEASE-TRAIN-STATE; not implied shipped).

## Chunk 0 status

- State/roadmap/execution-plan updated for redefined 6.17.7
- GitHub issues A–E opened (see RELEASE-TRAIN-STATE `githubIssues`)
