# @agent-inspect/index-sqlite

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
