# @agent-inspect/index-sqlite

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
