# @agent-inspect/studio

## 6.31.5

### Patch Changes

- Updated dependencies [909ea70]
  - agent-inspect@6.31.5

## 6.31.4

### Patch Changes

- Updated dependencies [fc7e7ad]
- Updated dependencies [fc7e7ad]
- Updated dependencies [98e0f30]
  - agent-inspect@6.31.4

## 6.31.3

### Patch Changes

- Updated dependencies [883f965]
  - agent-inspect@6.31.3

## 6.31.2

### Patch Changes

- Updated dependencies [520c7c3]
  - agent-inspect@6.31.2

## 6.31.1

### Patch Changes

- Updated dependencies [11a0159]
  - agent-inspect@6.31.1

## 6.31.0

### Patch Changes

- Updated dependencies [11a8b90]
  - agent-inspect@6.31.0

## 6.30.0

### Patch Changes

- Updated dependencies [094854f]
  - agent-inspect@6.30.0

## 6.29.6

### Patch Changes

- Updated dependencies [129f45a]
  - agent-inspect@6.29.6

## 6.29.5

### Patch Changes

- Updated dependencies [3e8750f]
  - agent-inspect@6.29.5

## 6.29.4

### Patch Changes

- Updated dependencies [d7a3801]
  - agent-inspect@6.29.4

## 6.29.3

### Patch Changes

- Updated dependencies [cf87bc9]
  - agent-inspect@6.29.3

## 6.29.2

### Patch Changes

- Updated dependencies [555052d]
  - agent-inspect@6.29.2

## 6.29.1

### Patch Changes

- d723406: Post-6.29 hardening: regex-free redaction policy, OTLP GenAI declared-vs-emitted honesty, recovery fail-closed contracts, AI SDK overlap/close terminalization (open rows only), Evidence refuse unsafe expected/oneOf values with bind-before-HTML packaging, and CLI/recipe DX for anyOf vs retry paths.
- Updated dependencies [d723406]
  - agent-inspect@6.29.1

## 6.29.0

### Patch Changes

- Updated dependencies [0e5732e]
  - agent-inspect@6.29.0

## 6.28.0

### Minor Changes

- 228b4df: Package resolved TraceContract / check-preset snapshots into Evidence v2 (`contract.resolved.json`) with digest binding to check results, honest partial/unavailable status for custom rules, and verify support — no signing or trusted-time claims (schema stays 1.0).

### Patch Changes

- Updated dependencies [228b4df]
  - agent-inspect@6.28.0

## 6.27.0

### Minor Changes

- 0f7c2e1: Bounded safe recovery contracts: additive TraceContract `retry.operations[]` oracles (read-first `retrieve_policy`), ADR-0011, and flagship recipe. Schema remains 1.0; AgentInspect still does not execute retries.

### Patch Changes

- Updated dependencies [0f7c2e1]
  - agent-inspect@6.27.0

## 6.26.0

### Minor Changes

- ec2ebbf: Outcome-aware behavioral sessions: `--preset behavioral-session` scores OUTCOME events without collapsing graceful tool errors into run failure, plus a synthetic MCP dual-axis recipe (#362).

### Patch Changes

- Updated dependencies [ec2ebbf]
  - agent-inspect@6.26.0

## 6.25.1

### Patch Changes

- ca0ce77: Fix retry fail-open on error→success (identity-based retry classification, chronological fallback/recovery rules) and preflight the omitted-payload 1 MiB bound before copying oversized inputs.
- Updated dependencies [ca0ce77]
  - agent-inspect@6.25.1

## 6.25.0

### Patch Changes

- 7750198: Stability baseline: freeze support/docs posture through 6.25.x, refresh packed-matrix honesty, and add property-style tool-argument safety checks.
- Updated dependencies [7750198]
  - agent-inspect@6.25.0

## 6.24.0

### Patch Changes

- 2fa9d46: Production adoption distribution: lifecycle guidance, init/doctor CLI docs, gate compact JSON and GitHub annotations, VS Code Marketplace deferral confirmed.
- Updated dependencies [2fa9d46]
  - agent-inspect@6.24.0

## 6.23.0

### Patch Changes

- 97b962f: Structured control contracts: JSON Pointer tool-argument checks, mixed orderRules, declared-versus-enforced controls, and retry/side-effect safety.
- Updated dependencies [97b962f]
  - agent-inspect@6.23.0

## 6.22.0

### Patch Changes

- 155acb8: Cross-runtime causal fidelity: mapping ledgers, typed relationship facts on TraceFacts, operation/attempt identity metadata, omitted-payload digests, W3C MCP propagation + guardrail refusal recipes (#331).
- Updated dependencies [155acb8]
  - agent-inspect@6.22.0

## 6.21.0

### Patch Changes

- 9d6a24f: Actor-scoped TraceContracts (`scope` selectors) and structural observation provenance (`observations.requireProvenance`) for multi-agent precision (#320/#321). Includes planner/verifier recipe.
- Updated dependencies [9d6a24f]
  - agent-inspect@6.21.0

## 6.20.0

### Patch Changes

- Updated dependencies [43a4481]
  - agent-inspect@6.20.0

## 6.19.1

### Patch Changes

- e23b94b: 6.19.1 trust restoration: redact free-text credentials in persisted error messages before disk, refresh shipped docs to match 6.19.0 reality, and enforce all 18 fixed-group package READMEs (including root `agent-inspect`) via `package-readmes:check`.
- Updated dependencies [e23b94b]
  - agent-inspect@6.19.1

## 6.19.0

### Minor Changes

- 07358f2: Add custom TraceReader authoring guidance with a synthetic foreign-session recipe, additive derived failure roles on TraceFacts (MCP/Evidence counts), architectural-intent interop docs/recipe, and bounded priorContextReferences convention.

### Patch Changes

- Updated dependencies [07358f2]
  - agent-inspect@6.19.0

## 6.18.0

### Minor Changes

- 4a1cd87: Bounded `preview` capture parity across official framework adapters through one shared helper (#311).

  `@agent-inspect/ai-sdk` and `@agent-inspect/openai-agents` previously accepted `capture: "preview"` and fell back to metadata-only with an `AI_ADAPTER_PREVIEW_NOT_AVAILABLE` warning. Both now persist bounded `*Preview` attributes, and `@agent-inspect/langchain` resolves its existing preview support through the same helper, so `capture`, `redactionProfile`, `maxPreviewChars`, and `onDiagnostic` mean the same thing in every adapter. A cross-adapter conformance matrix enforces the contract.

  Redaction runs on the structured value before a preview string is persisted, `maxPreviewChars` is a hard bound that the `share` and `strict` profiles cap further, and cycles, bigints, and throwing getters are handled without throwing into the traced application. Capture diagnostics are stable: `AI_CAPTURE_FIELD_UNAVAILABLE`, `AI_CAPTURE_PREVIEW_TRUNCATED`, and `AI_CAPTURE_PREVIEW_REDACTED`, reported through `onDiagnostic` and counted in `getDiagnostics().capture`.

  `metadata-only` remains the default and stays silent, there is no full-content capture mode, no network I/O is added, and the helper ships on the existing `agent-inspect/advanced` subpath rather than the root API. Preview redaction is key-based and bounded — it is not a sanitization guarantee for secrets embedded in free text.

- ba794e1: Add a no-key packed-consumer golden path for `@agent-inspect/ai-sdk` (`scripts/packed-ai-sdk-e2e.mjs`) and wire it into `pack:smoke` (#307, #213).
- 4fcee12: Render `view --errors-only` as a pruned human error tree (ancestors + failed nodes) while keeping `--errors-only --json` as the filtered event list (#330).
- 63b9606: Improve the broken-agent starter so good and regression paths return the same final answer while TraceContract trajectory checks PASS vs FAIL (`prove-same-output-wrong-path.mjs`).

### Patch Changes

- Updated dependencies [4a1cd87]
- Updated dependencies [ba794e1]
- Updated dependencies [4fcee12]
- Updated dependencies [8c65ee5]
- Updated dependencies [63b9606]
  - agent-inspect@6.18.0

## 6.17.8

### Patch Changes

- ddea9ea: Strictly validate `clean --keep` as a complete positive decimal integer token before planning deletions, so malformed values like `1.5`, `1e2`, or `10oops` fail closed instead of partial-parsing (#339, #340).
- b855436: Clarify `doctor` remediations with doc links for packed-consumer install mistakes, and land contributor regression coverage for packed-adapter golden paths, TraceFacts schema parity, and MCP protocol-state fixtures (#296, #305, #294, #302).
- 18941d0: Treat trace-derived MCP content as untrusted application data: advertise `instructions` on initialize, warn on trace-bearing tool descriptions, and add adversarial no-execution coverage (#344).
- Updated dependencies [ddea9ea]
- Updated dependencies [b855436]
- Updated dependencies [18941d0]
  - agent-inspect@6.17.8

## 6.17.7

### Patch Changes

- f66c77a: Align high-confidence key/value credential redaction with verify-safe `key-value-secret` detection (for example `internal_token=<credential>`), keep path findings review-only, and document that redact remains best-effort (#327).
- 4d617f5: Clarify that `observe()` records only the top-level run boundary (no invented `step_*` events), and accept `check --forbid-tool` as a compatibility alias for `--forbidden-tool`.
- 0f4ada3: Fix `search --name` + `--status` so run-level filters are applied conjunctively and status-only hits no longer bypass a non-matching name (#323). Unblock CI after Vitest 3 coverage hangs: serialize local `npm install` in compat fixtures, exclude those suites from coverage workers, and run them as a separate non-coverage CI step.
- Updated dependencies [f66c77a]
- Updated dependencies [4d617f5]
- Updated dependencies [0f4ada3]
  - agent-inspect@6.17.7

## 6.17.6

### Patch Changes

- 075dc87: Security containment: enforce Studio ingest byte limits, reject symlinks, stream and atomically stage imports (bundle / file-drop / GitHub / HTTP), remediate Vitest/nanoid and website/example advisories, add the default-workflow no-egress harness (#225), lock the published API surface snapshot (#211), correct Evidence format docs (no signing; required sourceHashes), and extend free-text redaction residual coverage.
- Updated dependencies [075dc87]
  - agent-inspect@6.17.6

## 6.17.5

### Patch Changes

- 093811b: Harden deterministic TraceContract / check gates against fail-open empty configs (rule execution evidence, unique order IDs, requiredOrder implies presence, tool policy includes running invocations, ObservedOutcome requireAny), map #308–#311 release ownership, and make demo:verify / pack:smoke validation cross-platform without unnecessary shell invocation.
- Updated dependencies [093811b]
  - agent-inspect@6.17.5

## 6.17.4

### Patch Changes

- Updated dependencies [c4b0f03]
  - agent-inspect@6.17.4

## 6.17.3

### Patch Changes

- 737bb03: Docs updates (README mark/loop, case-study template, Evidence retention guidance, support reproduction), TraceFacts/Evidence/OTLP/CLI regression tests, and exclude the RUN boundary from `run.slowestNode`.
- Updated dependencies [737bb03]
  - agent-inspect@6.17.3

## 6.17.2

### Patch Changes

- a7a7ea8: Union CLI check shorthands with preset select, resolve nested v0.1 LLM metadata in checks, and present Debug / Prevent / Share with curated showcase media.
- Updated dependencies [a7a7ea8]
  - agent-inspect@6.17.2

## 6.17.1

### Patch Changes

- 1904f50: Add public-safe LangGraph case study, use-case pages, demo Evidence samples (`pnpm demo:generate` / `demo:verify`), and fix `bundle verify --json` under the parent bundle command.
- Updated dependencies [1904f50]
  - agent-inspect@6.17.1

## 6.17.0

### Minor Changes

- 3294db3: Add check presets (`trajectory` / `safety` / `comprehensive`), local Evidence-on-failure flags for `check`/`gate`, and `bundle open` for verified local Evidence HTML.

### Patch Changes

- Updated dependencies [3294db3]
  - agent-inspect@6.17.0

## 6.16.2

### Patch Changes

- dab486a: Canonical docs website pipeline: load docs pages from repository Markdown via a content manifest and react-markdown renderer; remove the hand-maintained doc-content switch. Website-only dependency additions; no schema or runtime product change.
- Updated dependencies [dab486a]
  - agent-inspect@6.16.2

## 6.16.1

### Patch Changes

- 9aa0a80: Repository health and public-truth patch: permanent roadmap/active-plan structure, aggressive cleanup of archives/trains/proposals, ADRs, package-docs manifest, and repo:health CI gate. Docs/validators only — no schema or runtime product change.
- Updated dependencies [9aa0a80]
  - agent-inspect@6.16.1

## 6.16.0

### Minor Changes

- 5a62e84: Evidence-first CI launch candidate: moderate + deep-swarm golden check→gate→Evidence paths, pack:smoke wiring, and local MCP/CI walkthrough docs. No schema break; no new packages; no default network.

### Patch Changes

- Updated dependencies [5a62e84]
  - agent-inspect@6.16.0

## 6.15.0

### Minor Changes

- e70e3be: LangGraph fidelity classes A–E and persisted-trace developer APIs: relationship conformance, scaffolding diagnostics, openTraceFile/Directory/Text, TraceFacts/TraceContract conveniences, and stable AI\_\* remediation codes. No schema break; no new packages; no default network.

### Patch Changes

- Updated dependencies [e70e3be]
  - agent-inspect@6.15.0

## 6.14.2

### Patch Changes

- 4850b62: Swarm relationship and safety precision: fix self-parent capture/ordering, normalize legacy self-edges, cycle-safe trees, and stop treating token-configuration fields as credentials.
- Updated dependencies [4850b62]
  - agent-inspect@6.14.2

## 6.14.1

### Patch Changes

- 44f80dd: Public positioning and AI discoverability patch: align README/docs/website/package metadata with shipped 6.14 TraceFacts, Evidence, MCP, and experimental matchers; add llms/AI manifests, Agent Skill, and public-truth validators. Docs and presentation only — no schema/runtime change.
- Updated dependencies [44f80dd]
  - agent-inspect@6.14.1

## 6.14.0

### Patch Changes

- Updated dependencies [52a3e23]
  - agent-inspect@6.14.0

## 6.13.0

### Patch Changes

- Updated dependencies [2b7bbdf]
  - agent-inspect@6.13.0

## 6.12.2

### Patch Changes

- Updated dependencies [a3c0daa]
  - agent-inspect@6.12.2

## 6.12.1

### Patch Changes

- Updated dependencies [2a53751]
  - agent-inspect@6.12.1

## 6.12.0

### Minor Changes

- 3ee1692: Consolidation and stable launch candidate: positioning/portfolio tiers, install kits, honest packed/native/MCP matrices, PARTIAL design-partner trial worksheets, package maintenance audit (keep fixed group through v6), comparison/interop handoff, and launch demo checklist. No schema break; no new packages; no default upload; trial results not fabricated.

### Patch Changes

- Updated dependencies [3ee1692]
  - agent-inspect@6.12.0

## 6.11.0

### Minor Changes

- 1b5d5d8: Local coding-agent debug loop: MCP server executable, protocol hardening, curated flagship read-only tools, first-causal-failure engine, safe evidence/contract tools, client configure CLI, Cursor/Claude/Codex/Gemini instructions, no-key debug-loop recipe, protocol/privacy conformance corpus, and packed MCP consumer smoke. No schema break; no new root/core dependencies; local stdio only; redaction defaults not weakened.

### Patch Changes

- Updated dependencies [1b5d5d8]
  - agent-inspect@6.11.0

## 6.10.0

### Minor Changes

- 3d21e87: Portable Evidence v2: versioned evidence.json manifest (independent of trace schema), self-contained evidence.html with tree/timeline/causal/contract/diff/safety views, directory/html/zip bundle formats, bundle verify, CI artifacts/reporter evidence kind, XSS/a11y corpus, and packed E2E. No schema break; no new root/core dependencies; no default network upload; redaction defaults not weakened.

### Patch Changes

- Updated dependencies [3d21e87]
  - agent-inspect@6.10.0

## 6.9.0

### Minor Changes

- 627f5f4: Safety precision and share policy: additive finding taxonomy, path-aware raw-content and detector precision, framework metadata sensitivity, source-vs-artifact verify-safe/bundle/MCP gating, --explain, and local override docs. No schema break; no new root/core dependencies; no default network upload; defaults not weakened.

### Patch Changes

- Updated dependencies [627f5f4]
  - agent-inspect@6.9.0

## 6.8.0

### Minor Changes

- 69b6515: LangGraph fidelity contract for `@agent-inspect/langchain`: per-invocation lifecycle, callback reuse isolation, conservative parent reconciliation, synthetic semantic groups, tool identity fields, persist-by-intent, flush/finalize/close, and bounded diagnostics. Includes no-provider LangGraph coverage and NestJS/swarm recipes. No schema break; no new root/core dependencies; no default network upload.

### Patch Changes

- Updated dependencies [69b6515]
  - agent-inspect@6.8.0

## 6.7.5

### Patch Changes

- 5c4197f: Consumer and DX reliability: doctor resolves packages via entry (not package.json exports); Studio/index bump better-sqlite3 to 12.11.1 with lazy native load; LangChain omits absolute traceDir from attrs; Jest diagnoses missing trace associations; CLI output/profile aliases; NestJS/LangGraph env-gated recipe.
- Updated dependencies [5c4197f]
  - agent-inspect@6.7.5

## 6.7.4

### Patch Changes

- ab2ad83: Real-integration blocker patch: standalone LangGraph-shaped callback runs complete via active lifecycle; CLI shorthand check flags auto-select their rules; human tool display names; shared step labels and newest-first search; cross-command run-status golden; synthetic LangGraph fixtures; publish prior RUN-lifecycle and stats label fixes.
- Updated dependencies [ab2ad83]
  - agent-inspect@6.7.4

## 6.7.3

### Patch Changes

- Updated dependencies [ac6747d]
  - agent-inspect@6.7.3

## 6.7.2

### Patch Changes

- Updated dependencies [9c1f54c]
  - agent-inspect@6.7.2

## 6.7.1

### Patch Changes

- Updated dependencies [dea3d91]
  - agent-inspect@6.7.1

## 6.7.0

### Patch Changes

- Updated dependencies [5766d50]
  - agent-inspect@6.7.0

## 6.6.1

### Patch Changes

- 5766d50: Self-hosting ingestion security documentation and opt-in hardening guidance.
- Updated dependencies [5766d50]
  - agent-inspect@6.6.1

## 6.6.0

### Minor Changes

- 5766d50: Studio product pages (projects, runs, sessions, suites, safety, search), index refresh status, and Docker Compose example.

### Patch Changes

- Updated dependencies [5766d50]
  - agent-inspect@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies [e48a964]
  - agent-inspect@6.5.0

## 6.4.1

### Patch Changes

- 7e832d7: Trust and security patch: MCP result boundary, real bundle safety assessment, path sanitization, viewer XSS hardening, strict plugin manifests, gate validation, Studio init fixes, and packed quickstart E2E.
- Updated dependencies [7e832d7]
  - agent-inspect@6.4.1

## 6.4.0

### Patch Changes

- Updated dependencies [f2039d6]
  - agent-inspect@6.4.0

## 6.3.0

### Patch Changes

- Updated dependencies [4850e38]
  - agent-inspect@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [2de83f6]
  - agent-inspect@6.2.0

## 6.1.0

### Minor Changes

- v6.1.0 client-hosted ingestion for @agent-inspect/studio: file-drop, GitHub artifact import, optional HTTP ingest with token validation, and manual bundle upload. All ingest channels disabled by default; self-hosted only.

### Patch Changes

- Updated dependencies
  - agent-inspect@6.1.0

## 6.0.0

### Minor Changes

- New optional self-hosted Studio package: multi-project workspace registry, SQLite metadata cache, read-only API routes (`/api/projects`, runs, sessions, suites, checks, search, diff, reports, observations, guardrails, redaction, bundle export hints)
- `agent-inspect studio` CLI with localhost default, optional `--server` binding, and optional `--auth basic`
- Self-hosting guide at repo `docs/SELF-HOSTING.md`

## 5.4.0

### Patch Changes

- Updated dependencies
  - agent-inspect@5.4.0
