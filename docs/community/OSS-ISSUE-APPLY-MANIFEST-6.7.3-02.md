# OSS Issue Apply Manifest — 6.7.3 Adoption Evidence (02)

**Prepared:** 2026-07-15  
**Baseline:** `agent-inspect@6.7.3`  
**Repo:** `rajudandigam/agent-inspect`  
**Bodies:** `.github/LIVE_ISSUE_BATCH_6_7_ADOPTION_02/`  
**Script:** `scripts/create-oss-issue-batch-6.7.3-02.mjs`

## Issues to create (19)

| File | Title | Milestone | Labels |
| ---- | ----- | --------- | ------ |
| `001-external-pilot-feedback-form.md` | Add external pilot feedback form and anonymized evidence template | External Pilot & Adoption | documentation, good first issue, area:community, community-owned, status:ready, priority:p1 |
| `002-sync-pilot-kit-to-6.7.3.md` | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 | External Pilot & Adoption | documentation, testing, good first issue, area:community, area:release, community-owned, status:ready, priority:p1 |
| `003-retained-ci-gate-pilot-recipe.md` | Add a retained TraceContract/suite CI-gate pilot recipe | External Pilot & Adoption | examples, testing, area:core, community-owned, status:ready, difficulty:intermediate, priority:p1, support:beta |
| `004-windows-node22-esm-consumer-evidence.md` | Record Windows Node 22 ESM packed-consumer evidence | 6.7.3 — Correctness & Portability | testing, area:release, community-owned, status:ready, difficulty:intermediate, priority:p1, support:stable |
| `005-macos-cjs-consumer-evidence.md` | Record macOS Node 20/22 CJS packed-consumer evidence | 6.7.3 — Correctness & Portability | testing, area:release, community-owned, status:ready, difficulty:intermediate, priority:p1, support:stable |
| `006-node24-esm-cjs-consumer-evidence.md` | Extend packed-consumer compatibility evidence to Node 24 ESM and CJS | 6.7.3 — Correctness & Portability | testing, area:release, community-owned, status:ready, difficulty:intermediate, priority:p2, support:stable |
| `007-native-sqlite-install-matrix.md` | Add native SQLite clean-install compatibility matrix | 6.7.3 — Correctness & Portability | testing, area:index, area:release, community-owned, status:ready, difficulty:advanced, priority:p1, support:beta |
| `008-extend-packed-golden-path-e2e.md` | Extend packed golden-path E2E through report, check, bundle, and verify-safe | Golden Path & Examples | testing, examples, area:core, area:release, community-owned, status:ready, difficulty:advanced, priority:p1 |
| `009-contract-fail-then-pass-fixture.md` | Add broken-run → contract-fail → fixed-run golden-path fixture | Golden Path & Examples | fixtures, examples, testing, area:core, community-owned, status:ready, difficulty:intermediate, priority:p1, support:beta |
| `010-safe-bundle-studio-import.md` | Add share-safe bundle → local Studio import walkthrough | Golden Path & Examples | documentation, examples, area:studio, community-owned, status:ready, difficulty:intermediate, priority:p2, support:beta |
| `011-github-artifact-studio-import.md` | Add GitHub Actions artifact → Studio import walkthrough | External Pilot & Adoption | documentation, examples, testing, area:studio, community-owned, status:ready, difficulty:advanced, priority:p2, support:preview |
| `012-standards-preservation-corpus.md` | Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions | Standards Evidence | testing, fixtures, area:standards, integration:otel, integration:openinference, community-owned, status:ready, difficulty:advanced, priority:p1, support:preview |
| `013-standards-version-loss-consistency.md` | Add standards tested-version and known-loss consistency check | Standards Evidence | documentation, testing, good first issue, area:standards, community-owned, status:ready, priority:p1, support:preview |
| `014-local-collector-roundtrip.md` | Add local OpenTelemetry Collector round-trip recipe | Standards Evidence | examples, testing, area:standards, integration:otel, community-owned, status:ready, difficulty:advanced, priority:p1, support:preview |
| `015-mcp-protocol-state-corpus.md` | Add MCP protocol-state fixture corpus | Standards Evidence | fixtures, testing, area:mcp, integration:mcp, community-owned, status:ready, difficulty:intermediate, priority:p1, support:supported |
| `016-writer-shutdown-concurrency-corpus.md` | Add writer crash, concurrency, and shutdown regression corpus | 6.7.3 — Correctness & Portability | testing, area:core, community-owned, status:ready, difficulty:advanced, priority:p1, support:stable |
| `017-third-party-adapter-conformance-ci.md` | Add third-party adapter conformance CI template | Golden Path & Examples | documentation, testing, area:adapters, community-owned, status:ready, difficulty:intermediate, priority:p2, support:beta |
| `018-readme-support-network-consistency.md` | Add package README support-level and network-behavior consistency check | Contributor Experience — 2026 Q3 | documentation, testing, good first issue, area:release, area:community, community-owned, status:ready, priority:p2 |
| `019-large-directory-performance-evidence.md` | Add large trace-directory warning and performance evidence suite | 6.7.3 — Correctness & Portability | testing, fixtures, area:index, area:workspace, community-owned, status:ready, difficulty:intermediate, priority:p2, support:beta |

## Issues skipped as duplicates

None (exact-title and semantic SKIP_DUPLICATE_OPEN / SKIP_COMPLETED = 0).

## Issues reframed (still create)

| # | Reason |
| - | ------ |
| 3 | Extend existing gate recipes for pilot retainability |
| 7 | Beyond #106 optional smoke → OS×Node native SQLite matrix |
| 10 | Beyond shareable-bundle recipe → Studio import walkthrough |
| 11 | Beyond GHA artifact recipe → Studio import + network boundary |
| 19 | Beyond #68 fixtures → retained warning/perf evidence suite |

## Labels used

`documentation`, `testing`, `fixtures`, `examples`, `good first issue`, `area:community`, `area:release`, `area:core`, `area:index`, `area:studio`, `area:standards`, `area:mcp`, `area:adapters`, `area:workspace`, `community-owned`, `status:ready`, `difficulty:intermediate`, `difficulty:advanced`, `priority:p1`, `priority:p2`, `support:stable`, `support:beta`, `support:preview`, `support:supported`, `integration:otel`, `integration:openinference`, `integration:mcp`

## Milestones used

- External Pilot & Adoption
- 6.7.3 — Correctness & Portability
- Golden Path & Examples
- Standards Evidence
- Contributor Experience — 2026 Q3

## Difficulty distribution

| Tier | Count | Issues |
| ---- | ----- | ------ |
| Good first | **4** | 1, 2, 13, 18 |
| Intermediate | **9** | 3, 4, 5, 6, 9, 10, 15, 17, 19 |
| Advanced | **6** | 7, 8, 11, 12, 14, 16 |

## Manual review boundaries

- Do not fabricate external pilot evidence or mark PRE-V7 rows complete.
- Do not change package versions, schema, redaction, network defaults, or official adapter contracts.
- Good-first issues must stay docs/truth only (no schema/security/release internals).
- Writer runtime changes (issue 16) require maintainer acknowledgement.
- Preserve open #65, #66, #67, #100, #115; do not touch held PR #142.
- Optional project attach: GitHub Project **AgentInspect OSS** (#1) via `OSS_PROJECT_NUMBER=1` when project scopes work; else add manually.

## Apply gates

| Mode | Behavior |
| ---- | -------- |
| Default / `DRY_RUN=1` | Print plan; create nothing |
| `OSS_APPLY=1` and `DRY_RUN=0` | Create issues; write `CREATED-OSS-ISSUES-6.7.3-02.md` |

Never: publish, tag, release, collaborator changes, force-push.
