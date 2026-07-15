# OSS Issue Batch — 6.7.3 Adoption Evidence (02)

Prepared issue bodies and create script for the pre-v7 evidence contributor batch against **`agent-inspect@6.7.3`**.

## Sources

| Artifact | Path |
| -------- | ---- |
| Audit | [OSS-ISSUE-BATCH-AUDIT-6.7.3-02.md](./OSS-ISSUE-BATCH-AUDIT-6.7.3-02.md) |
| Dedup | [OSS-ISSUE-DEDUP-REPORT-6.7.3-02.md](./OSS-ISSUE-DEDUP-REPORT-6.7.3-02.md) |
| Apply manifest | [OSS-ISSUE-APPLY-MANIFEST-6.7.3-02.md](./OSS-ISSUE-APPLY-MANIFEST-6.7.3-02.md) |
| Bodies | [`.github/LIVE_ISSUE_BATCH_6_7_ADOPTION_02/`](../../.github/LIVE_ISSUE_BATCH_6_7_ADOPTION_02/) |
| Create script | [`scripts/create-oss-issue-batch-6.7.3-02.mjs`](../../scripts/create-oss-issue-batch-6.7.3-02.mjs) |

## Issues (19)

| # | File | Title | Decision | Milestone | Difficulty |
| - | ---- | ----- | -------- | --------- | ---------- |
| 1 | `001-…` | Add external pilot feedback form and anonymized evidence template | CREATE | External Pilot & Adoption | good first |
| 2 | `002-…` | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 | CREATE | External Pilot & Adoption | good first |
| 3 | `003-…` | Add a retained TraceContract/suite CI-gate pilot recipe | REFRAME→CREATE | External Pilot & Adoption | intermediate |
| 4 | `004-…` | Record Windows Node 22 ESM packed-consumer evidence | CREATE | 6.7.3 — Correctness & Portability | intermediate |
| 5 | `005-…` | Record macOS Node 20/22 CJS packed-consumer evidence | CREATE | 6.7.3 — Correctness & Portability | intermediate |
| 6 | `006-…` | Extend packed-consumer compatibility evidence to Node 24 ESM and CJS | CREATE | 6.7.3 — Correctness & Portability | intermediate |
| 7 | `007-…` | Add native SQLite clean-install compatibility matrix | REFRAME→CREATE | 6.7.3 — Correctness & Portability | advanced |
| 8 | `008-…` | Extend packed golden-path E2E through report, check, bundle, and verify-safe | CREATE | Golden Path & Examples | advanced |
| 9 | `009-…` | Add broken-run → contract-fail → fixed-run golden-path fixture | CREATE | Golden Path & Examples | intermediate |
| 10 | `010-…` | Add share-safe bundle → local Studio import walkthrough | REFRAME→CREATE | Golden Path & Examples | intermediate |
| 11 | `011-…` | Add GitHub Actions artifact → Studio import walkthrough | REFRAME→CREATE | External Pilot & Adoption | advanced |
| 12 | `012-…` | Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions | CREATE | Standards Evidence | advanced |
| 13 | `013-…` | Add standards tested-version and known-loss consistency check | CREATE | Standards Evidence | good first |
| 14 | `014-…` | Add local OpenTelemetry Collector round-trip recipe | CREATE | Standards Evidence | advanced |
| 15 | `015-…` | Add MCP protocol-state fixture corpus | CREATE | Standards Evidence | intermediate |
| 16 | `016-…` | Add writer crash, concurrency, and shutdown regression corpus | CREATE | 6.7.3 — Correctness & Portability | advanced |
| 17 | `017-…` | Add third-party adapter conformance CI template | CREATE | Golden Path & Examples | intermediate |
| 18 | `018-…` | Add package README support-level and network-behavior consistency check | CREATE | Contributor Experience — 2026 Q3 | good first |
| 19 | `019-…` | Add large trace-directory warning and performance evidence suite | REFRAME→CREATE | 6.7.3 — Correctness & Portability | intermediate |

All 19 are scheduled for GitHub **CREATE** (REFRAME means semantically distinct from completed work; still creates a new live issue).

## Preserve

Do not recreate: **#65, #66, #67, #100, #115**. Leave PR **#142** alone.

## Apply

```bash
# Dry-run (default)
DRY_RUN=1 node scripts/create-oss-issue-batch-6.7.3-02.mjs

# Create only after explicit maintainer approval:
OSS_APPLY=1 DRY_RUN=0 node scripts/create-oss-issue-batch-6.7.3-02.mjs
```

Or reply exactly: `APPLY OSS EVIDENCE BATCH`.
