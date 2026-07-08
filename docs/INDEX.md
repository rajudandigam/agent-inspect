# Optional Local Index (`@agent-inspect/index-sqlite`)

The optional SQLite index accelerates local queries over large AgentInspect trace directories. It is **experimental** (added in v4.1) and entirely opt-in.

- **Source of truth stays JSONL.** The index is derived from your trace files and is always safe to delete.
- **Never mutates traces.** Building, rebuilding, and cleaning the index only touch the index database file.
- **Local-only.** No network access. No upload. No hosted service.
- **Not required.** Every core CLI command works without it; the index only speeds up queries.

## Install

```bash
npm install @agent-inspect/index-sqlite
```

The package depends on `better-sqlite3` (a native module). The core `agent-inspect` package has no SQLite dependency.

## CLI

```bash
agent-inspect index sqlite build            # build/rebuild trace-index.sqlite
agent-inspect index sqlite status --json    # health, counts, staleness
agent-inspect index sqlite query --status error --tool search
agent-inspect index sqlite clean            # delete the index (traces untouched)
```

See [CLI.md § 6.23](CLI.md) for the full flag reference.

## Programmatic API

```ts
import {
  buildIndex,
  queryRuns,
  indexStatus,
  isIndexStale,
  resolveIndexDbPath,
} from "@agent-inspect/index-sqlite";

const { dbPath, runs } = await buildIndex({ traceDir: ".agent-inspect/runs" });

const failed = queryRuns(dbPath, { status: "error", tool: "search", limit: 50 });

const status = indexStatus(dbPath); // { healthy, runs, steps, builtAt, ... }
```

All read functions are non-throwing: a missing or corrupt index returns empty
results (for `queryRuns`), `healthy: false` (for `indexStatus`), or `true` (for
`isIndexStale`), so callers can transparently fall back to a directory scan.

## Layout

The index database defaults to `<traceDir>/trace-index.sqlite`. It stores derived
`runs`, `steps`, `errors`, and `sessions` tables plus a `meta` table recording the
schema version, source directory, and build time.

## Staleness and recovery

- **Staleness:** an index is stale when any trace file is newer than the recorded
  build time. `status` reports this; rebuild to refresh.
- **Corruption:** a failed integrity check is treated as "absent". Queries return
  empty and a rebuild recreates the database from scratch.

## Boundaries

- No vector or semantic search.
- No background daemon.
- No SQLite dependency in root/core.
- No trace schema changes; deleting the index is always safe.
