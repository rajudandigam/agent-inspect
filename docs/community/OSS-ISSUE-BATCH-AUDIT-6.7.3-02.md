# OSS Issue Batch Audit — 6.7.3 Adoption Evidence (02)

**Audit date:** 2026-07-15  
**Repo:** `rajudandigam/agent-inspect`  
**Branch audited:** `main` @ `726f4c3` (`docs: record 6.7.3 publish and return to adoption freeze`)  
**Working branch (prep):** `chore/pre-v7-oss-evidence-issue-batch`

## Current package / repository baseline

| Field | Value |
| ----- | ----- |
| Root package version | **6.7.3** |
| Linked public packages | **18** aligned at 6.7.3 (`pnpm linked-versions:check` OK) |
| Persisted schema | **1.0** |
| Node engines | `>=20` |
| Default branch | `main` |
| Visibility | public |
| Issues enabled | yes |
| Discussions enabled | yes |
| Node (audit host) | v22.22.3 |
| pnpm | 9.15.0 |
| Phase | Pre-v7 adoption evidence / freeze guidance (not a hard product lock for this batch) |

## Open issues (preserve)

| # | Title | Milestone | Notes |
| - | ----- | --------- | ----- |
| 65 | VS Code extension onboarding screenshots/GIF | Golden Path & Examples | good first; keep |
| 66 | VS Code: open sample trace command | Golden Path & Examples | blocked; keep |
| 67 | Improve doctor troubleshooting messages | Contributor Experience — 2026 Q3 | good first; keep |
| 100 | Add CODEOWNERS and area ownership policy | Contributor Experience — 2026 Q3 | maintainer-owned; keep |
| 115 | Recipe: ADPA-style intent → contract → implementation → validation trace | Golden Path & Examples | design-partner gated; keep |

**Open count:** 5. Do not duplicate or reopen completed work.

## Open PRs

| # | Title | Author | Notes |
| - | ----- | ------ | ----- |
| 142 | feat(examples): add adpa-codebase-change-trace recipe | @abhay-codes07 | Held pending Menno / #115 review — leave alone |

## Current labels (taxonomy present)

Core OSS taxonomy is live, including `area:*`, `status:*`, `difficulty:*`, `priority:*`, `community-owned` / `maintainer-owned`, `support:*`, and `integration:*`. Full list captured via `gh label list` during audit (≈80 labels).

Labels this batch will use exist on the remote (documented in apply manifest).

## Current milestones

| # | Title | State | Open | Closed |
| - | ----- | ----- | ---- | ------ |
| 5 | OSS Hygiene | open | 1 | 5 |
| 6 | Examples and Fixtures | open | 1 | 4 |
| 7 | Adapter SDK Examples | open | 0 | 5 |
| 8 | UI and Performance Polish | open | 2 | 1 |
| 10 | **6.7.3 — Correctness & Portability** | open | 0 | 6 |
| 11 | **Contributor Experience — 2026 Q3** | open | 2 | 5 |
| 12 | **Golden Path & Examples** | open | 3 | 3 |
| 13 | **Standards Evidence** | open | 0 | 5 |
| 14 | **External Pilot & Adoption** | open | 0 | 0 |

Milestones used by this batch: **#10, #11, #12, #13, #14**.

## GitHub Project status

| Project | Status |
| ------- | ------ |
| AgentInspect OSS (#1 under `@rajudandigam`) | open (`PVT_kwHOAFPY484BdDyV`) |

Create script may attach issues when `OSS_PROJECT_NUMBER` is set; otherwise print manual project-add steps.

## Pre-v7 evidence gaps

From [`docs/PRE-V7-PILOT-KIT.md`](../PRE-V7-PILOT-KIT.md) and [`docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md`](../implementation/PRE-V7-ADOPTION-EVIDENCE.md):

- Pilot kit still pins **`agent-inspect@6.7.1`**; stop text still mentions 6.7.1 on npm.
- Adoption evidence header still says technical LC **`6.7.1`**; Studio row says test against **`6.7.0`**.
- Design-partner acceptance: all fields `_pending_`.
- External pilot table (3 teams): all `_pending_`.
- No structured external pilot feedback form / anonymized intake path.
- No retained CI-gate **pilot recipe** documented as copyable retainability evidence (recipes exist, pilot framing does not).
- Collector / Phoenix external round-trip: still pending.
- Pending evidence rows must remain pending (do not fabricate).

## Compatibility matrix gaps

| Environment | Node | Module | Status |
| ----------- | ---- | ------ | ------ |
| Linux | 22 | ESM | partial (CI Ubuntu) |
| macOS | 20 | CJS | **pending** |
| Windows | 22 | ESM | **pending** |
| Node 24 | ESM+CJS | — | **not recorded** |
| Native SQLite OS×Node matrix | — | — | **missing** (optional pack smoke / #106 ≠ OS matrix) |

[`scripts/consumer-compat-matrix.mjs`](../../scripts/consumer-compat-matrix.mjs) records the **current host** only after pack smoke.

## Golden-path automation gaps

| Script | Covers | Missing |
| ------ | ------ | ------- |
| `scripts/packed-quickstart-e2e.mjs` | init → demo → list → verify-safe | report, check, bundle |
| `scripts/golden-path-e2e.mjs` | init/demo/list → verify-safe → report | check, bundle, contract→fail→fix causal fixture automation, Studio |

Recommended path in `docs/GOLDEN-PATH.md` includes check + share-safe bundle; packed smoke does not yet prove the full chain.

## Standards evidence gaps

- Basic fixtures: `fixtures/standards/{openinference,otlp}-basic.json`, export golden (#7 closed).
- Gap: preservation corpus (scope, links, events, extensions + intentional losses).
- Gap: tested-version + known-loss **public-truth consistency check**.
- Gap: local OpenTelemetry Collector round-trip recipe (optional / skippable).

## MCP evidence gaps

- Closed **#110**: privacy/adversarial fixtures.
- Gap: protocol-state corpus (protocol error, tool error, cancellation, progress, approval, transport, normal completion).

## Issue-index drift

| Doc | Drift |
| --- | ----- |
| `GOOD-FIRST-ISSUES.md` | Still says **6.7.2** adoption freeze |
| `docs/community/GOOD-FIRST-ISSUES.md` | Milestones OK; version narrative may lag |
| `docs/community/OSS-ROADMAP.md` | Claims current npm **6.7.2** |
| `docs/community/OSS-METRICS.md` | **Missing** on main (create/update after apply) |
| Bug issue form placeholders | May still mention 6.7.2 |

Live open good-first issues after prior batch were largely closed; index needs refresh **after** this batch is created on GitHub.

## Proposed duplicate decisions (summary)

See [`OSS-ISSUE-DEDUP-REPORT-6.7.3-02.md`](./OSS-ISSUE-DEDUP-REPORT-6.7.3-02.md).

- Exact titles for 19 proposed issues: **none match** open or closed issues.
- Semantic near-matches exist for recipes (#24/#106/#68/#110/#7/#25/#99) — handled as **CREATE** with reframed scope or **REFRAME**, not SKIP empty.
- Survival: **19** CREATE/REFRAME with material new scope (≥15 gate).

## Hard constraints for this batch

Repository-management and documentation only until apply:

- No runtime code, versions, Changesets, publish, tags, schema, redaction, exports, collaborator, or branch-protection mutations in prep.
- GitHub issue creation only when `OSS_APPLY=1` or maintainer replies `APPLY OSS EVIDENCE BATCH`.
- Synthetic, local, secret-free examples only; do not fabricate pilot evidence.
