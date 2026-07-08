# RFC: Optional Local Index (`@agent-inspect/index-sqlite`)

**Target:** v4.1.0
**Status:** Active planning
**Depends on:** [LOCAL-TRACE-WORKSPACE.md](./LOCAL-TRACE-WORKSPACE.md) (v4.0.0)

## Summary

Introduce an **opt-in, rebuildable, disposable** local index that accelerates queries (search / stats / sessions / cohort) over a real project's trace directory. JSONL remains the single source of truth; the index is a derived cache and is never required for normal CLI use. The index lives in a new **optional** package `@agent-inspect/index-sqlite` so no database dependency ever enters root or core.

## Motivation

At 1k–100k events, repeated full-directory scans for `search`, `stats`, and `sessions` become slow. A local SQLite cache turns these into indexed lookups while preserving the local-first, no-upload, JSONL-authoritative model.

## Product boundary

- Optional package only. **No SQLite in root or core.**
- No semantic/vector search in v4.1.
- No remote service, no background daemon by default.
- No network, no upload.
- The index is always safe to delete; deleting it never affects traces.

## Driver decision

**`better-sqlite3`** (maintainer-approved). Rationale:

- Mature, fast, synchronous API well-suited to a CLI/batch indexer.
- Ships prebuilt binaries, keeping the package installable on Node >= 20 without forcing a Node 22+/experimental path.
- Considered and rejected: `node:sqlite` (still requires `--experimental-sqlite` on Node 22 → poor consumer UX) and a pure-JS index (slower, reimplements query planning).

The dependency is confined to `@agent-inspect/index-sqlite`. Core and root remain dependency-light.

## Index location

Under the workspace: `.agent-inspect/index/trace-index.sqlite` (workspace `index.path` when set; otherwise the default `index/` folder). All index paths are resolved with the workspace traversal guard.

## Proposed schema (derived, disposable)

- `meta(key, value)` — schema version, source dir, `builtAt`, file count, driver.
- `runs(run_id PK, file, mtime_ms, name, status, started_at, ended_at, duration_ms, session_id, group_id, correlation_id)`
- `steps(id, run_id FK, step_id, kind, name, status, duration_ms, tool_name, model, parent_id)`
- `errors(id, run_id FK, step_id, message, code)`
- `sessions(session_id PK, run_count, first_started_at, last_ended_at)` (derived)
- Indexes on `runs(status, session_id, started_at)` and `steps(run_id, kind, tool_name)`.

Rows are derived from the canonical reader pipeline (`agent-inspect/advanced`) — no parallel JSONL parsing and no trace mutation.

## Rebuild / staleness / recovery

- **Rebuild is idempotent:** a full rebuild produces the same DB contents for the same inputs.
- **Staleness:** compare newest trace `mtime` against `meta.builtAt` (reuse `indexIsStale` semantics from `adapter-sdk`).
- **Corruption recovery:** on open failure or `PRAGMA integrity_check` failure, the index is treated as absent and transparently rebuilt; a corrupt file is never trusted.
- **Disposable:** `clean` deletes the DB file; queries fall back to directory scan.

## Query integration

The CLI's `search` / `stats` / `sessions` gain optional index acceleration: when a fresh index exists they query SQLite; otherwise they fall back to the existing scan path. Results must be **parity-equal** to the scan path (tested).

## CLI surface

`agent-inspect index-sqlite <build|rebuild|status|search|query|clean>` (JSON mode + stable exit codes), kept separate from the existing metadata `index` command to avoid conflating the JSON metadata cache with the SQLite engine.

## Non-goals

- No root DB dependency.
- No required index for core CLI.
- No vector/semantic search.
- No network / upload / hosted service.

## Safety

- Local file DB only; path-traversal guards on all index paths.
- No trace mutation; index is read-derived and disposable.
- Bounded input; large directories are indexed with an explicit cap and warning.

## Publication gate

`@agent-inspect/index-sqlite` is a **new public package**. Per `AGENTS.md`, its first publication is a manual maintainer gate: implement → validate → commit → push → stop, then the maintainer configures the npm Trusted Publisher (or `NPM_TOKEN` fallback) and performs the first publish.

## Implementation phasing

Follows [release-trains/V4.1.0-EXECUTION-PLAN.md](../implementation/release-trains/V4.1.0-EXECUTION-PLAN.md): scaffold → schema/builder → CLI → query integration + perf → docs/readiness.
