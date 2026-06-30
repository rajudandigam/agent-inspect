# Issue hygiene plan — post-v3.5.x OSS roadmap

**Generated:** 2026-06-09  
**Local branch:** `main` @ `368678e` (docs: record v3.5.3 publication complete)  
**GitHub apply status:** **NOT APPLIED** — scripts generated for maintainer review (`GH_APPLY=1` required)

---

## Phase 0 audit summary

### Local package version

| Source | Version | Notes |
| ------ | ------- | ----- |
| `package.json` | **3.5.3** | Source of truth |
| `README.md` Install section | **3.5.2** | Stale — refresh in #031 / doc pass |
| `ROADMAP.md` header | **3.0.0** | Stale — refresh in #031 |
| `CHANGELOG.md` top | **3.5.3** | Aligned |

**Verdict:** Minor doc drift (README/ROADMAP vs package.json). **Safe to proceed** with issue hygiene artifacts and doc updates. No runtime or version bump in this pass.

### Repo state

- **Product:** v3.x trace workbench shipped (adapters, harness, init/doctor, VS Code scaffold, performance docs, adapter-sdk, 16 linked npm packages).
- **Persisted schema:** 1.0 (manual v0.1 still readable).
- **Core gap (maintainer-owned):** unified persisted run model across manual traces, logs, callbacks, CI artifacts, standards exports.

### GitHub open issues (18)

| # | Title | Milestone | Lane |
| - | ----- | --------- | ---- |
| 7 | OpenInference export fixture | OSS Activation Batch 1 | Standards |
| 9 | AgentInspect vs production observability comparison | OSS Activation Batch 1 | OSS Hygiene |
| 10 | Tool failure + retry fixture | OSS Activation Batch 1 | Examples/Fixtures |
| 11 | Timeline command proposal | Roadmap Next: CLI proposals | **Close** (shipped 1.4.0) |
| 12 | Stats command proposal | Roadmap Next: CLI proposals | **Close** (shipped 1.4.0) |
| 13 | Decision metadata recipe | Roadmap Next: Adapter/design | Examples/Fixtures |
| 14 | Persisted LangChain streaming design | Roadmap Next: Adapter/design | **Close** (shipped 1.3.0) |
| 18 | First PR walkthrough | — | OSS Hygiene |
| 19 | Update contributor docs with live issue links | OSS Activation Batch 1 | OSS Hygiene |
| 22 | MCP tool-call trace fixture | OSS Activation Batch 1 | **Review** (recipe exists) |
| 23 | Vercel AI SDK manual instrumentation recipe | OSS Activation Batch 1 | **Close** (ai-sdk recipes shipped) |
| 24 | GitHub Actions trace artifact recipe | OSS Activation Batch 1 | **Close** (recipe + CI-ARTIFACTS shipped) |
| 25 | Phoenix/OpenInference import recipe | OSS Activation Batch 1 | Standards |
| 27 | Log ingest config cookbook | OSS Activation Batch 1 | Examples/Fixtures |
| 28 | Multi-run fixture pack for stats | OSS Activation Batch 1 | **Refresh** → performance pack (#041) |
| 29 | LangChain persisted trace example | OSS Activation Batch 1 | Examples/Fixtures |
| 30 | Vercel AI SDK adapter design note | OSS Activation Batch 1 | **Close** (@agent-inspect/ai-sdk shipped) |

### GitHub closed issues (relevant, 4)

| # | Title | Shipped evidence |
| - | ----- | ---------------- |
| 8 | Improve diff CLI output examples | Merged |
| 20 | Clean install smoke-test guide | `docs/INSTALL-SMOKE-TEST.md` |
| 21 | Winston structured logging recipe | `examples/recipes/winston-json-logs/` |
| 26 | Safe trace sharing checklist | `docs/SAFE-TRACE-SHARING.md` |

### Current milestones (open)

1. OSS Activation Batch 1  
2. Roadmap Next: CLI proposals  
3. Roadmap Next: Adapter/design proposals  
4. OSS Activation Batch 2  

**Preferred v3 milestones (not created yet):** OSS Hygiene · Examples and Fixtures · Adapter SDK Examples · UI and Performance Polish · Standards and Graduation — see `scripts/github-milestones-v3-oss.sh`.

### Labels (30)

Existing labels sufficient for batch 03. Optional future labels: `adapter-sdk`, `vscode`, `performance`, `standards` (create manually if desired when opening #33–#42).

### Local vs GitHub mismatches

| Area | Mismatch |
| ---- | -------- |
| `GOOD-FIRST-ISSUES.md` | Lists closed #8, #20, #21, #26 as open; stale batch 01/02 framing |
| `ROADMAP.md` Now section | Still v2.1 train + batch 01/02; current release says 3.0.0 |
| Issue #22 | Open on GitHub; `examples/recipes/mcp-client-tracing/` shipped — **needs maintainer decision** (close or refresh for canonical `fixtures/`) |
| Issue #10 | Open; `tool-failure-retry` recipe + `fixtures/traces/error-recovery.jsonl` exist — **refresh** to circuit/retry pack |
| Issue #7 | Open; partial OpenInference coverage in `fixtures/traces-v1.0/` and tests — **refresh**, keep open |

---

## Actions (this pass)

### Keep open — refresh wording

| Issue | Action | Milestone (target) |
| ----- | ------ | ------------------ |
| #7 | Refresh — export fixture + conformance for current schema | Standards and Graduation |
| #9 | Refresh — compare doc vs current package map (v3.5) | OSS Hygiene |
| #10 | Refresh — retry/circuit fixture pack (recipe exists) | Examples and Fixtures |
| #13 | Refresh — decision metadata without chain-of-thought | Examples and Fixtures |
| #18 | Refresh — first PR walkthrough for v3 repo | OSS Hygiene |
| #19 | Refresh — live links + v3 lane groupings | OSS Hygiene |
| #25 | Refresh — Phoenix/OI graduation guide | Standards and Graduation |
| #27 | Refresh — log ingest cookbook (pino/log4js/Nest/Winston) | Examples and Fixtures |
| #29 | Refresh — LangChain persist example for current adapter | Examples and Fixtures |

Artifacts: `.github/ISSUE_UPDATES_V3_OSS/` + `scripts/update-existing-issues-v3-oss.sh`

### Close / supersede (verified shipped)

| Issue | Reason | Replacement |
| ----- | ------ | ------------- |
| #11 | `agent-inspect timeline` shipped 1.4.0 | `packages/cli/src/timeline.ts`, CHANGELOG 1.4.0 |
| #12 | `agent-inspect stats` shipped 1.4.0 | CHANGELOG 1.4.0 |
| #14 | LangChain streaming metadata shipped 1.3.0 | `fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl` |
| #23 | AI SDK adapter + recipes shipped | `examples/recipes/ai-sdk-*`, `@agent-inspect/ai-sdk` |
| #24 | CI artifact recipe shipped | `examples/recipes/github-actions-artifact/`, `docs/CI-ARTIFACTS.md` |
| #30 | AI SDK adapter shipped | `packages/ai-sdk/`, `docs/AI-SDK-ADOPTION.md` |

Artifacts: `.github/ISSUE_CLOSE_NOTES_V3_OSS/` + `scripts/close-stale-issues-v3-oss.sh`

### Refresh instead of close

| Issue | Reason |
| ----- | ------ |
| #28 | `fixtures/sessions/` exists but no dedicated performance fixture pack — reframe as #041 |

### Needs maintainer decision (not auto-closed)

| Issue | Reason |
| ----- | ------ |
| #22 | `mcp-client-tracing` recipe shipped; issue asked for `fixtures/` canonical trace — close or narrow scope |

### New issues (batch 03 — prepared, not created)

| Draft | Title | Lane |
| ----- | ----- | ---- |
| 031 | Align public roadmap with current release | OSS Hygiene (maintainer-reviewed) |
| 032 | Refresh GOOD-FIRST-ISSUES for v3 | OSS Hygiene |
| 033 | Minimal adapter SDK third-party example | Adapter SDK Examples |
| 034 | Adapter SDK privacy checklist example | Adapter SDK Examples |
| 035 | Custom renderer example | Adapter SDK Examples |
| 036 | Custom transform example | Adapter SDK Examples |
| 037 | Extension registry submission template | Adapter SDK Examples |
| 038 | VS Code onboarding screenshots/GIF | UI and Performance Polish |
| 039 | VS Code open sample trace command | UI and Performance Polish |
| 040 | Improve doctor troubleshooting messages | OSS Hygiene |
| 041 | Performance fixture pack | UI and Performance Polish |
| 042 | Streaming limitations examples | Examples and Fixtures (doc exists — verify/expand) |

Artifacts: `.github/LIVE_ISSUE_BATCH_03/` + `scripts/create-live-issues-batch-03.sh`

---

## Contributor-safe vs maintainer-owned

### Contributor-safe (this roadmap)

Docs, examples, fixtures, CLI examples, logging recipes, export fixtures, comparison docs, proposal docs, test fixtures, integration examples, adapter SDK **examples**, VS Code/viewer docs, performance fixtures, standards recipes.

### Maintainer-owned (do not scope in contributor issues)

Unified persisted InspectEvent model, schema evolution, redaction/security internals, package export policy, official adapter internals, OTLP sink architecture, v2/v3 trace contract changes, release process.

---

## Manual steps after review

1. Review this plan and all `.github/ISSUE_*` artifacts.
2. `DRY_RUN=1 ./scripts/github-milestones-v3-oss.sh` then `GH_APPLY=1 ./scripts/github-milestones-v3-oss.sh` if milestones approved.
3. `DRY_RUN=1 ./scripts/update-existing-issues-v3-oss.sh` then `GH_APPLY=1 ...`
4. `DRY_RUN=1 ./scripts/close-stale-issues-v3-oss.sh` then `GH_APPLY=1 ...`
5. `DRY_RUN=1 ./scripts/create-live-issues-batch-03.sh` then `GH_APPLY=1 ...`
6. Update `GOOD-FIRST-ISSUES.md` with live issue numbers from batch 03 creation.
7. Verify GitHub UI.

---

## Files missing from audit checklist (not required)

- `docs/implementation/ROADMAP-EXECUTION-V1.5-TO-V2.md` — not present (superseded by v3 train docs)
- `docs/implementation/CURSOR-MAINTAINER-ROADMAP.md` — not present

All other checklist files were present and read.
