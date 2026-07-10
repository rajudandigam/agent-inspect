# @agent-inspect/index-sqlite

Optional, disposable **local SQLite index** for faster queries over [AgentInspect](https://github.com/rajudandigam/agent-inspect) JSONL traces.


**Support level:** Beta — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

- **Local-only:** no network, no default upload.
- **JSONL stays the source of truth.** The index is a derived cache and is always safe to delete.
- **Never mutates trace files.**
- Cross-platform native install is only claimed where tested — see adoption evidence / pack smoke.

## Install

```bash
npm install agent-inspect @agent-inspect/index-sqlite
```

`agent-inspect` is a peer dependency. `better-sqlite3` is bundled as a dependency (prebuilt binaries; Node >= 20).

## Usage

```ts
import {
  buildIndex,
  queryRuns,
  indexStatus,
  cleanIndex,
  resolveIndexDbPath,
} from "@agent-inspect/index-sqlite";

// Build (or fully rebuild — idempotent) from a trace directory.
const result = await buildIndex({ traceDir: ".agent-inspect/runs" });
console.log(result.runs, result.steps, result.dbPath);

// Fast queries against the index (falls back to [] if missing/corrupt).
const failed = queryRuns(result.dbPath, { status: "error", limit: 20 });
const withTool = queryRuns(result.dbPath, { tool: "search", kind: "tool" });

// Status and cleanup.
console.log(indexStatus(result.dbPath));
await cleanIndex(resolveIndexDbPath(".agent-inspect/runs"));
```

## Behavior

- **Rebuild is idempotent:** building twice from identical inputs yields identical contents.
- **Corruption recovery:** a missing or `integrity_check`-failing database is treated as absent; queries return empty and a rebuild recreates it.
- **Staleness:** `isIndexStale(dbPath, newestTraceMtimeMs)` reports when traces are newer than the index.
- **Disposable:** deleting the database never affects traces.

## Boundaries

- No SQLite dependency in `agent-inspect` core or root — it lives only here.
- No vector/semantic search, no daemon, no remote service.


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.
