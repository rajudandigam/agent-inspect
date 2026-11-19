# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: c0p-packaging-repair
currentTrain: c0p-packaging-repair
trainStatus: "C0P packaging repair + patch changeset committing for PR → Version Packages → Trusted Publish repair release"
currentChunk: "C0+C0P — commit/push/verify/release (in progress)"
nextAction: "Merge C0P PR; merge Version Packages; confirm all 18 npm tarballs include dist; then C1a #544"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/NEXT-RELEASES.md
pendingManualGate: "EVIDENCE_GATE not approved — blocks 6.32.0; Indu v3 artifact missing; partner acceptance #484/#437"
worktreeIgnoreOnly:
  - .redstamp/
  - redstamp-proposal-issue-body.md
  - .tmp-plumbline/
  - tmp/
  - .worktrees/
  - .webmcp-integration-work/
  - release-artifacts/
```

## C0 baseline (2026-11-18)

| Fact | Value |
| --- | --- |
| SHA | `504db32aea71b62a79657e3b6ce00eb9748c914d` |
| Branch | `main` |
| Version | `6.31.37` |
| Node / pnpm | v22.22.3 / 9.15.0 |
| Dirty at start | clean |
| npm root | intact |
| npm scoped | **broken on registry** — dry-pack ≈ 3 files (LICENSE/README/package.json), no `dist/` |
| States | local C0P validated ≠ merged ≠ published ≠ externally accepted |

## C0P local validation (2026-11-18) — reviewable, not committed

| Check | Result |
| --- | --- |
| `pnpm run build` + `release-artifacts pack` | 18 packages, version `6.31.37`, sourceSha `504db32…` |
| Scoped min fileCount | **9** (was 3 on registry); langchain includes `dist/index.{cjs,mjs,d.ts,d.cts}` |
| Empty scoped tarballs | **0** |
| Second-workspace `qualify` | **18/18** consumers OK |
| `node --test scripts/release-artifacts.test.mjs` | **5/5** pass (incl. empty 3-file rejection) |
| `pnpm run pack:smoke` | OK |
| `git diff --check` | OK |
| Commit / push / publish | **not done** (maintainer review) |

**Not published.** Registry `6.31.37` scoped payloads remain empty until a separately authorized repair release after this diff merges.

## Published baseline

**6.31.37** — Trusted Publish [44215415755](https://github.com/rajudandigam/agent-inspect/actions/runs/44215415755); Version Packages [#546](https://github.com/rajudandigam/agent-inspect/pull/546). Publication succeeded but **scoped registry payloads lack compiled `dist/`** (C0P). Prior **6.31.36**: [43735681865](https://github.com/rajudandigam/agent-inspect/actions/runs/43735681865) / [#545](https://github.com/rajudandigam/agent-inspect/pull/545). Open follow-ups: #543 (eval maxTotalTokens), #544 (per-budget matrix). Registry repair requires a separately authorized release after C0P lands.

## Nov 4 residual train (done)

| Chunk | Status | Notes |
| --- | --- | --- |
| C12 diagnostics polish | **shipped 6.31.35** | #522 follow-up bound/order + observation note |
| C13 Dependabot / Actions | **reviewed** | #496/#506 leave red; #444/#500/#501 not merged |
| C14 entity/value recipe | **shipped 6.31.35** | #527 recipe-local TraceCheckRule |
| C15 RETRIEVER order | **shipped 6.31.35** | illustrative OI fixtures + recipe-local rule |
| C16 trust-boundary docs | **shipped 6.31.35** | LIMITATIONS + PARKED-DESIGNS |

Earlier C01–C11 remains as recorded for **6.31.34**.

## Residual queue

| Item | Status | Notes |
| --- | --- | --- |
| #484 / #437 | **open** | ADR-0013 hold; partner acceptance |
| #526 | **open** | Windows docs; maintainer merge call |
| #496 / #506 | **leave red** | do not merge |
| 6.32 / v7 | **blocked** | EVIDENCE_GATE |

## Honesty

- Partner issues stay open for acceptance.
- Indu exact v3 artifact remains unavailable (no v2 rename).
- EVIDENCE_GATE / v7 unchanged.
