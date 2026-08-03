# @agent-inspect/index-sqlite

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

### Patch Changes

- Updated dependencies
  - agent-inspect@6.1.0

## 6.0.0

### Patch Changes

- Updated dependencies
  - agent-inspect@6.0.0

## 5.4.0

### Patch Changes

- Updated dependencies [31d5324]
  - agent-inspect@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies [165b1dc]
  - agent-inspect@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [52c2539]
  - agent-inspect@5.2.0

## 5.1.0

### Patch Changes

- Updated dependencies [44e9684]
  - agent-inspect@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [c5e3b16]
  - agent-inspect@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [42635d8]
  - agent-inspect@4.4.0

## 4.3.0

### Patch Changes

- Updated dependencies [8a21bce]
  - agent-inspect@4.3.0

## 4.2.0

### Minor Changes

- Align the linked package suite to 4.2.0. No behavior changes in these packages; keeps published versions consistent with the v4.2 sessions and activity release.

### Patch Changes

- Updated dependencies
  - agent-inspect@4.2.0

## 4.1.0

### Minor Changes

- Add the optional local trace index (v4.1).

  - New optional package `@agent-inspect/index-sqlite`: a disposable, rebuildable SQLite index over AgentInspect JSONL traces for faster local queries. JSONL stays the source of truth, trace files are never mutated, deleting the index is always safe, and there is no network access. SQLite (`better-sqlite3`) lives only in this optional package — never in root/core.
  - New `agent-inspect index sqlite` CLI subcommands (`build`, `rebuild`, `status`, `query`, `clean`) that load the optional package on demand and print an install hint when it is absent.
  - Non-throwing read APIs (`queryRuns`, `indexStatus`, `isIndexStale`) with corruption/staleness recovery so callers can transparently fall back to a directory scan.
  - Docs: `docs/INDEX.md` plus `docs/CLI.md` reference.

### Patch Changes

- Updated dependencies
  - agent-inspect@4.1.0
