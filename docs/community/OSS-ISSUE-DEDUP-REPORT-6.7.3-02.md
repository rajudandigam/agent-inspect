# OSS Issue Dedup Report — 6.7.3 Adoption Evidence (02)

**Audit date:** 2026-07-15  
**Baseline:** `agent-inspect@6.7.3` on `main` @ `726f4c3`  
**Method:** Exact title match across open+closed issues; keyword search; code/docs existence check.

**Survival:** 15 CREATE + 4 REFRAME = **19** with material new scope (≥15 gate).

---

## Issue 1 — Pilot feedback form

| Field | Value |
| ----- | ----- |
| Proposed title | Add external pilot feedback form and anonymized evidence template |
| Decision | **CREATE** |
| Matching issues | Closed **#99** (structured YAML issue forms) — generic bug/feature/docs/integration only |
| Matching code/docs | `.github/ISSUE_TEMPLATE/{bug,feature,docs}.yml`, `integration_request.md`; no pilot form |
| Reason | No contributor-facing structured pilot intake; #99 does not cover anonymized pre-v7 evidence fields |
| Final title | Add external pilot feedback form and anonymized evidence template |

## Issue 2 — Sync pilot kit to 6.7.3

| Field | Value |
| ----- | ----- |
| Proposed title | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 |
| Decision | **CREATE** |
| Matching issues | None (closed #97 refreshed contributor docs for 6.7.2; not pilot kit sync to 6.7.3) |
| Matching code/docs | `docs/PRE-V7-PILOT-KIT.md` pins 6.7.1; `PRE-V7-ADOPTION-EVIDENCE.md` LC 6.7.1 / Studio 6.7.0 |
| Reason | Material version drift vs published 6.7.3; pending evidence rows must stay pending |
| Final title | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 |

## Issue 3 — Retained CI-gate pilot recipe

| Field | Value |
| ----- | ----- |
| Proposed title | Add a retained TraceContract/suite CI-gate pilot recipe |
| Decision | **REFRAME** |
| Matching issues | Open **#115** ADPA recipe (different: intent→contract governance); closed artifact/gate recipes related to #24 era |
| Matching code/docs | `examples/recipes/{github-actions-gate,deterministic-ci-checks,trace-suite-basic,eval-ci-artifacts}/` |
| Reason | Gates/recipes exist; missing is a **pilot-facing retainability** recipe documenting durable fail/pass CI retention without provider keys |
| Final title | Add a retained TraceContract/suite CI-gate pilot recipe |

## Issue 4 — Windows Node 22 ESM evidence

| Field | Value |
| ----- | ----- |
| Proposed title | Record Windows Node 22 ESM packed-consumer evidence |
| Decision | **CREATE** |
| Matching issues | Closed **#104** Windows file URL/path portability sweep (code/path fixes, not packed-consumer matrix evidence) |
| Matching code/docs | `PRE-V7-ADOPTION-EVIDENCE.md` Windows 22 ESM `_pending_`; `scripts/consumer-compat-matrix.mjs` |
| Reason | Distinct evidence recording task; do not mark pass without real Windows run |
| Final title | Record Windows Node 22 ESM packed-consumer evidence |

## Issue 5 — macOS CJS evidence

| Field | Value |
| ----- | ----- |
| Proposed title | Record macOS Node 20/22 CJS packed-consumer evidence |
| Decision | **CREATE** |
| Matching issues | None |
| Matching code/docs | Adoption evidence macOS 20 CJS `_pending_` |
| Reason | Real macOS CJS packed consumption still unrecorded |
| Final title | Record macOS Node 20/22 CJS packed-consumer evidence |

## Issue 6 — Node 24 ESM+CJS evidence

| Field | Value |
| ----- | ----- |
| Proposed title | Extend packed-consumer compatibility evidence to Node 24 ESM and CJS |
| Decision | **CREATE** |
| Matching issues | None |
| Matching code/docs | Engine policy remains `>=20`; Node 24 not in evidence table |
| Reason | Record results without changing official engines unless separately approved |
| Final title | Extend packed-consumer compatibility evidence to Node 24 ESM and CJS |

## Issue 7 — Native SQLite install matrix

| Field | Value |
| ----- | ----- |
| Proposed title | Add native SQLite clean-install compatibility matrix |
| Decision | **REFRAME** |
| Matching issues | Closed **#106** optional-package clean-consumer smoke fixture |
| Matching code/docs | `packages/index-sqlite/`, `scripts/package-smoke.mjs` optional smoke |
| Reason | #106 is generic optional smoke; need OS×Node **native** install/create/rebuild/query matrix for beta SQLite |
| Final title | Add native SQLite clean-install compatibility matrix |

## Issue 8 — Extend packed golden-path E2E

| Field | Value |
| ----- | ----- |
| Proposed title | Extend packed golden-path E2E through report, check, bundle, and verify-safe |
| Decision | **CREATE** |
| Matching issues | None |
| Matching code/docs | `scripts/packed-quickstart-e2e.mjs` stops at verify-safe; `docs/GOLDEN-PATH.md` recommends more |
| Reason | Material automation gap on packed (non-workspace) path |
| Final title | Extend packed golden-path E2E through report, check, bundle, and verify-safe |

## Issue 9 — Broken → contract-fail → fixed fixture

| Field | Value |
| ----- | ----- |
| Proposed title | Add broken-run → contract-fail → fixed-run golden-path fixture |
| Decision | **CREATE** |
| Matching issues | Open **#115** (ADPA governance recipe) — different domain; closed TraceContract bug #139 |
| Matching code/docs | `scripts/golden-path-e2e.mjs` does not exercise broken→fail→fixed causal pair |
| Reason | Deterministic causal debugging fixture still missing |
| Final title | Add broken-run → contract-fail → fixed-run golden-path fixture |

## Issue 10 — Share-safe bundle → Studio import

| Field | Value |
| ----- | ----- |
| Proposed title | Add share-safe bundle → local Studio import walkthrough |
| Decision | **REFRAME** |
| Matching issues | Closed Studio a11y #111; bugs #137/#135 |
| Matching code/docs | `examples/recipes/shareable-bundle-basic/`, Studio package, `docs/SAFE-TRACE-SHARING.md` |
| Reason | Bundle recipe exists; end-to-end **local Studio import** walkthrough after verify-safe is missing |
| Final title | Add share-safe bundle → local Studio import walkthrough |

## Issue 11 — GHA artifact → Studio import

| Field | Value |
| ----- | ----- |
| Proposed title | Add GitHub Actions artifact → Studio import walkthrough |
| Decision | **REFRAME** |
| Matching issues | Historical closed GitHub Actions artifact recipe (#24 era) |
| Matching code/docs | `examples/recipes/github-actions-artifact/` |
| Reason | Artifact upload recipe ≠ explicit user-operated Studio import with network behavior documented |
| Final title | Add GitHub Actions artifact → Studio import walkthrough |

## Issue 12 — Standards preservation corpus

| Field | Value |
| ----- | ----- |
| Proposed title | Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions |
| Decision | **CREATE** |
| Matching issues | Closed **#7** OpenInference export round-trip fixture; **#25** graduation docs |
| Matching code/docs | `fixtures/standards/*-basic.json`, `openinference-export-golden.json` |
| Reason | Basic/export goldens ≠ preservation of scope/links/events/extensions + named losses |
| Final title | Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions |

## Issue 13 — Standards version/loss consistency

| Field | Value |
| ----- | ----- |
| Proposed title | Add standards tested-version and known-loss consistency check |
| Decision | **CREATE** |
| Matching issues | Closed **#102** public-doc and archived-link regression checks (links, not standards version/loss claims) |
| Matching code/docs | `docs/STANDARDS.md`, `scripts/validate-public-truth.mjs` |
| Reason | Need validator catching unversioned / unconditional standards claims |
| Final title | Add standards tested-version and known-loss consistency check |

## Issue 14 — Local Collector round-trip

| Field | Value |
| ----- | ----- |
| Proposed title | Add local OpenTelemetry Collector round-trip recipe |
| Decision | **CREATE** |
| Matching issues | Closed **#25** Phoenix/OpenInference graduation docs; recipe `phoenix-openinference-import` |
| Matching code/docs | Adoption evidence: Collector/Phoenix pending |
| Reason | Phoenix import ≠ local Collector round-trip; must stay optional/skippable, no default upload |
| Final title | Add local OpenTelemetry Collector round-trip recipe |

## Issue 15 — MCP protocol-state corpus

| Field | Value |
| ----- | ----- |
| Proposed title | Add MCP protocol-state fixture corpus |
| Decision | **CREATE** |
| Matching issues | Closed **#110** MCP privacy/adversarial; **#22** tool-call fixture |
| Matching code/docs | `packages/mcp/test/adversarial.test.ts`, `examples/recipes/mcp-client-tracing/` |
| Reason | Privacy corpus ≠ protocol-state classification (error/cancel/progress/approval/transport) |
| Final title | Add MCP protocol-state fixture corpus |

## Issue 16 — Writer crash/concurrency/shutdown

| Field | Value |
| ----- | ----- |
| Proposed title | Add writer crash, concurrency, and shutdown regression corpus |
| Decision | **CREATE** |
| Matching issues | Closed **#107** malformed JSONL final-line corpus (related but narrower) |
| Matching code/docs | Writer isolation tests exist partially; no dedicated concurrent crash/shutdown corpus |
| Reason | New regression corpus; runtime changes need maintainer ack |
| Final title | Add writer crash, concurrency, and shutdown regression corpus |

## Issue 17 — Third-party adapter conformance CI

| Field | Value |
| ----- | ----- |
| Proposed title | Add third-party adapter conformance CI template |
| Decision | **CREATE** |
| Matching issues | Closed adapter SDK example issues (#60–#63 era); official conformance docs |
| Matching code/docs | `docs/ADAPTER-CONFORMANCE.md`, `packages/adapter-sdk/`, `docs/implementation/adapter-conformance-matrix.json` |
| Reason | Official maintainer gate ≠ copyable external-repo CI template |
| Final title | Add third-party adapter conformance CI template |

## Issue 18 — README support/network consistency

| Field | Value |
| ----- | ----- |
| Proposed title | Add package README support-level and network-behavior consistency check |
| Decision | **CREATE** |
| Matching issues | Closed **#102** doc links; **#103** executable README snippet for one package |
| Matching code/docs | `docs/SUPPORT-LEVELS.md`, `docs/NETWORK-BEHAVIOR.md`, package READMEs |
| Reason | Cross-package maturity + network claim drift check still missing |
| Final title | Add package README support-level and network-behavior consistency check |

## Issue 19 — Large-directory performance evidence

| Field | Value |
| ----- | ----- |
| Proposed title | Add large trace-directory warning and performance evidence suite |
| Decision | **REFRAME** |
| Matching issues | Closed **#68** Performance fixture pack; **#109** index-versus-scan parity |
| Matching code/docs | `scripts/performance-baseline.mjs`, `fixtures/performance/`, `packages/cli/src/trace-dir-scale.ts` |
| Reason | Generation/warnings shipped; need **retained evidence suite** (non-flaky), not greenfield warnings |
| Final title | Add large trace-directory warning and performance evidence suite |

---

## Skip summary

| Category | Count |
| -------- | ----- |
| SKIP_DUPLICATE_OPEN | 0 |
| SKIP_COMPLETED | 0 |
| CREATE | 15 |
| REFRAME_EXISTING_GAP | 4 |
| NEEDS_MAINTAINER_DECISION | 0 |

Preserved open issues (#65, #66, #67, #100, #115) were checked; none of the 19 titles duplicate them.
