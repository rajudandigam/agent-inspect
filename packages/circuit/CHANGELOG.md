# @agent-inspect/circuit

## 6.17.7

### Patch Changes

- f66c77a: Align high-confidence key/value credential redaction with verify-safe `key-value-secret` detection (for example `internal_token=<credential>`), keep path findings review-only, and document that redact remains best-effort (#327).
- 4d617f5: Clarify that `observe()` records only the top-level run boundary (no invented `step_*` events), and accept `check --forbid-tool` as a compatibility alias for `--forbidden-tool`.
- 0f4ada3: Fix `search --name` + `--status` so run-level filters are applied conjunctively and status-only hits no longer bypass a non-matching name (#323). Unblock CI after Vitest 3 coverage hangs: serialize local `npm install` in compat fixtures, exclude those suites from coverage workers, and run them as a separate non-coverage CI step.

## 6.17.6

### Patch Changes

- 075dc87: Security containment: enforce Studio ingest byte limits, reject symlinks, stream and atomically stage imports (bundle / file-drop / GitHub / HTTP), remediate Vitest/nanoid and website/example advisories, add the default-workflow no-egress harness (#225), lock the published API surface snapshot (#211), correct Evidence format docs (no signing; required sourceHashes), and extend free-text redaction residual coverage.

## 6.17.5

### Patch Changes

- 093811b: Harden deterministic TraceContract / check gates against fail-open empty configs (rule execution evidence, unique order IDs, requiredOrder implies presence, tool policy includes running invocations, ObservedOutcome requireAny), map #308–#311 release ownership, and make demo:verify / pack:smoke validation cross-platform without unnecessary shell invocation.

## 6.17.4

## 6.17.3

### Patch Changes

- 737bb03: Docs updates (README mark/loop, case-study template, Evidence retention guidance, support reproduction), TraceFacts/Evidence/OTLP/CLI regression tests, and exclude the RUN boundary from `run.slowestNode`.

## 6.17.2

### Patch Changes

- a7a7ea8: Union CLI check shorthands with preset select, resolve nested v0.1 LLM metadata in checks, and present Debug / Prevent / Share with curated showcase media.

## 6.17.1

### Patch Changes

- 1904f50: Add public-safe LangGraph case study, use-case pages, demo Evidence samples (`pnpm demo:generate` / `demo:verify`), and fix `bundle verify --json` under the parent bundle command.

## 6.17.0

### Minor Changes

- 3294db3: Add check presets (`trajectory` / `safety` / `comprehensive`), local Evidence-on-failure flags for `check`/`gate`, and `bundle open` for verified local Evidence HTML.

## 6.16.2

### Patch Changes

- dab486a: Canonical docs website pipeline: load docs pages from repository Markdown via a content manifest and react-markdown renderer; remove the hand-maintained doc-content switch. Website-only dependency additions; no schema or runtime product change.

## 6.16.1

### Patch Changes

- 9aa0a80: Repository health and public-truth patch: permanent roadmap/active-plan structure, aggressive cleanup of archives/trains/proposals, ADRs, package-docs manifest, and repo:health CI gate. Docs/validators only — no schema or runtime product change.

## 6.16.0

### Minor Changes

- 5a62e84: Evidence-first CI launch candidate: moderate + deep-swarm golden check→gate→Evidence paths, pack:smoke wiring, and local MCP/CI walkthrough docs. No schema break; no new packages; no default network.

## 6.15.0

### Minor Changes

- e70e3be: LangGraph fidelity classes A–E and persisted-trace developer APIs: relationship conformance, scaffolding diagnostics, openTraceFile/Directory/Text, TraceFacts/TraceContract conveniences, and stable AI\_\* remediation codes. No schema break; no new packages; no default network.

## 6.14.2

### Patch Changes

- 4850b62: Swarm relationship and safety precision: fix self-parent capture/ordering, normalize legacy self-edges, cycle-safe trees, and stop treating token-configuration fields as credentials.

## 6.14.1

### Patch Changes

- 44f80dd: Public positioning and AI discoverability patch: align README/docs/website/package metadata with shipped 6.14 TraceFacts, Evidence, MCP, and experimental matchers; add llms/AI manifests, Agent Skill, and public-truth validators. Docs and presentation only — no schema/runtime change.

## 6.14.0

## 6.13.0

## 6.12.2

## 6.12.1

## 6.12.0

### Minor Changes

- 3ee1692: Consolidation and stable launch candidate: positioning/portfolio tiers, install kits, honest packed/native/MCP matrices, PARTIAL design-partner trial worksheets, package maintenance audit (keep fixed group through v6), comparison/interop handoff, and launch demo checklist. No schema break; no new packages; no default upload; trial results not fabricated.

## 6.11.0

### Minor Changes

- 1b5d5d8: Local coding-agent debug loop: MCP server executable, protocol hardening, curated flagship read-only tools, first-causal-failure engine, safe evidence/contract tools, client configure CLI, Cursor/Claude/Codex/Gemini instructions, no-key debug-loop recipe, protocol/privacy conformance corpus, and packed MCP consumer smoke. No schema break; no new root/core dependencies; local stdio only; redaction defaults not weakened.

## 6.10.0

### Minor Changes

- 3d21e87: Portable Evidence v2: versioned evidence.json manifest (independent of trace schema), self-contained evidence.html with tree/timeline/causal/contract/diff/safety views, directory/html/zip bundle formats, bundle verify, CI artifacts/reporter evidence kind, XSS/a11y corpus, and packed E2E. No schema break; no new root/core dependencies; no default network upload; redaction defaults not weakened.

## 6.9.0

### Minor Changes

- 627f5f4: Safety precision and share policy: additive finding taxonomy, path-aware raw-content and detector precision, framework metadata sensitivity, source-vs-artifact verify-safe/bundle/MCP gating, --explain, and local override docs. No schema break; no new root/core dependencies; no default network upload; defaults not weakened.

## 6.8.0

### Minor Changes

- 69b6515: LangGraph fidelity contract for `@agent-inspect/langchain`: per-invocation lifecycle, callback reuse isolation, conservative parent reconciliation, synthetic semantic groups, tool identity fields, persist-by-intent, flush/finalize/close, and bounded diagnostics. Includes no-provider LangGraph coverage and NestJS/swarm recipes. No schema break; no new root/core dependencies; no default network upload.

## 6.7.5

### Patch Changes

- 5c4197f: Consumer and DX reliability: doctor resolves packages via entry (not package.json exports); Studio/index bump better-sqlite3 to 12.11.1 with lazy native load; LangChain omits absolute traceDir from attrs; Jest diagnoses missing trace associations; CLI output/profile aliases; NestJS/LangGraph env-gated recipe.

## 6.7.4

### Patch Changes

- ab2ad83: Real-integration blocker patch: standalone LangGraph-shaped callback runs complete via active lifecycle; CLI shorthand check flags auto-select their rules; human tool display names; shared step labels and newest-first search; cross-command run-status golden; synthetic LangGraph fixtures; publish prior RUN-lifecycle and stats label fixes.

## 6.7.3

## 6.7.2

## 6.7.1

## 6.7.0

### Patch Changes

- Updated dependencies [5766d50]
  - agent-inspect@6.7.0

## 6.6.1

### Patch Changes

- Updated dependencies
  - agent-inspect@6.6.1

## 6.6.0

### Patch Changes

- Updated dependencies [5766d50]
  - agent-inspect@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies [e48a964]
  - agent-inspect@6.5.0

## 6.4.0

### Patch Changes

- Align linked package version with agent-inspect@6.4.0 release train.

## 6.1.0

### Minor Changes

- v6.1.0 client-hosted ingestion for @agent-inspect/studio: file-drop, GitHub artifact import, optional HTTP ingest with token validation, and manual bundle upload. All ingest channels disabled by default; self-hosted only.

## 6.0.0

### Minor Changes

- Align the linked package suite to 6.0.0 for the self-hosted Studio release train.

## 5.4.0

### Minor Changes

- Align the linked package suite to 5.4.0. No behavior changes in this package; keeps published versions consistent with the v5.4 PM/QA eval templates release.

## 5.3.0

### Minor Changes

- Align the linked package suite to 5.3.0. No behavior changes in this package; keeps published versions consistent with the v5.3 suite viewer release.

## 5.2.0

### Minor Changes

- Align the linked package suite to 5.2.0. No behavior changes in this package; keeps published versions consistent with the v5.2 CI quality gates release.

## 5.1.0

### Minor Changes

- Align the linked package suite to 5.1.0. No behavior changes in this package; keeps published versions consistent with the v5.1 cohort analysis release.

## 5.0.0

### Minor Changes

- Align the linked package suite to 5.0.0. No behavior changes in this package; keeps published versions consistent with the v5.0 trace suite config release.

## 4.4.0

### Minor Changes

- Align the linked package suite to 4.4.0. No behavior changes in this package; keeps published versions consistent with the v4.4 observed outcomes release.

## 4.3.0

### Minor Changes

- Align the linked package suite to 4.3.0. No behavior changes in this package; keeps published versions consistent with the v4.3 shareable trace bundles release.

## 4.2.0

### Minor Changes

- Align the linked package suite to 4.2.0. No behavior changes in these packages; keeps published versions consistent with the v4.2 sessions and activity release.

## 4.1.0

### Minor Changes

- Align the linked package suite to 4.1.0. No behavior changes in these packages; this keeps the published versions consistent with the v4.1 optional local index release.

## 4.0.0

### Patch Changes

- Linked release: version aligned to `agent-inspect` 4.0.0 (local trace workspace). No behavior changes in this package.

## 3.5.5

### Patch Changes

- 822da6c: Fix npm README images: use absolute raw GitHub SVG URLs with sanitize=true so the product-loop diagram and logos render on npmjs.com. Harden readme-product-loop.svg for sanitizer compatibility. Docs-only; no runtime API changes.

## 3.5.4

### Patch Changes

- 1ffe989: v3.5.4 README adoption polish: centered brand header, product-loop visual, npm package files for linked docs/assets. Docs-only; no runtime API changes.

## 3.5.3

### Patch Changes

- 05546b5: v3.5.3 docs hygiene: lean docs index, archive stale files, remove unavailable hero SVG from npm package files. Docs-only.

## 3.5.2

### Patch Changes

- 14d4ccc: v3.5.2 adoption demo kit: DEMO-SCRIPT, PITCH, Show HN draft, video script, SCREENSHOTS diagram index. Docs-only.

## 3.5.1

### Patch Changes

- af17d04: v3.5.1 adoption polish: root README and npm presentation, package READMEs, adoption docs, link/tarball hygiene. Docs-only; no runtime API changes.

## 3.5.0

### Minor Changes

- 71e94de: v3.5 adoption kit: ADOPTION guide, demo scripts, design partner kit, starter polish, comparison refresh, post-v3.5 handoff.

## 3.4.0

### Minor Changes

- 2fef104: v3.4 performance hardening: scale warnings, optional index CLI, stall/timeout check rules, performance and streaming docs.

## 3.3.0

### Minor Changes

- eaf8549: v3.3 VS Code surface: read-only extension scaffold, trace explorer, CLI-backed review commands, doctor output channel, adoption docs.

## 3.2.0

### Minor Changes

- 80f8f30: v3.2 framework adoption pack: AI SDK and OpenAI Agents local-only guides, NestJS harness path, Mastra RFC (deferred), adapter conformance evidence refresh.

## 3.1.0

### Minor Changes

- 70f3fb2: v3.1 adoption train: public `@agent-inspect/harness`, `agent-inspect init` and `doctor` commands, adoption starters, and onboarding docs.

## 3.0.0

### Major Changes

- a1f743f: v3.0 extension contracts: `@agent-inspect/adapter-sdk` with registration, conformance, privacy helpers, transform/renderer contracts, optional rebuildable indexer, and community extension registry documentation. Linked major semver bump; persisted trace schema 1.0 unchanged.

## 2.6.0

### Minor Changes

- 57efe08: Release v2.6.0 with optional localhost viewer and read-only MCP server surfaces.

  This train adds `@agent-inspect/viewer`, `agent-inspect serve`, `@agent-inspect/mcp-server` read-only trace tools, and defers IDE extension until post-v2.6 demand review. All optional surfaces are read-only with share-profile defaults.

## 2.5.0

### Minor Changes

- 11edf90: Release v2.5.0 with deterministic guardrails and circuit utilities.

  This train adds `@agent-inspect/guardrails` and `@agent-inspect/circuit`, optional `check --guardrails` / `check --circuit` flags, eval safety rule factories, and recipes. No compliance claims, no remote policy engine, and no default enforcement.

## Unreleased

### Added

- Deterministic trace analyzers for tool/args repetition, loop iterations, retries, tool timeouts, runaway LLM loops, and branch width.
