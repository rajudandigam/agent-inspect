# Self-hosted Studio — v6.0.0 RFC

**Status:** Accepted for v6.0.0 train (chunk 0)  
**Baseline:** `agent-inspect@5.4.0`  
**Related:** [V6.0.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.0.0-EXECUTION-PLAN.md) · [LOCAL-TRACE-WORKSPACE.md](./LOCAL-TRACE-WORKSPACE.md) · [OPTIONAL-LOCAL-INDEX.md](./OPTIONAL-LOCAL-INDEX.md) · [LOCAL-VIEWER.md](./LOCAL-VIEWER.md) · [SUITE-VIEWER-V5.3.md](./SUITE-VIEWER-V5.3.md) · [SHAREABLE-BUNDLES-V4.3.md](./SHAREABLE-BUNDLES-V4.3.md)

Customer-owned, self-hosted internal analyzer for multi-project AgentInspect workspaces. **No maintainer cloud. No default upload.**

---

## 1. Problem

v4–v5 delivered project-local workspaces, optional SQLite indexing, suite regression evaluation, CI gates, and a localhost suite/workspace viewer. Teams running multiple projects or importing CI artifacts need a **persistent, team-facing analyzer** they can run on their own infrastructure — without AgentInspect operating a hosted service.

Studio is the v6 answer: a read-only web UI and API over workspace evidence, backed by a local or team-owned database, started with `agent-inspect studio`.

---

## 2. Goals (v6.0.0)

- New optional package **`@agent-inspect/studio`** (explicit install; not bundled in root).
- CLI entry: `agent-inspect studio` (wired from root CLI when the package is installed).
- **Self-hosted only:** customer runs the process; no maintainer-operated backend.
- **Localhost by default** (`127.0.0.1`); non-localhost binding requires explicit opt-in with a startup warning.
- **Read-only HTTP:** GET/HEAD routes only; no trace mutation, no ingest, no replay execution.
- **Multi-project workspace** support: discover and browse runs, sessions, suites, checks, evals, observations, guardrails, and reports across configured projects.
- **SQLite default** for studio metadata/query cache (package-scoped driver); optional Postgres for team deployments (package-scoped only).
- **JSONL + workspace manifest remain canonical;** the studio DB is a derived, disposable cache (same philosophy as `@agent-inspect/index-sqlite`).
- Reuse existing readers, checks, suite, workspace, cohort, gate, and bundle exporters — **no parallel parsing or normalization.**

### Views (v6.0 scope)

| Area | Purpose |
| ---- | ------- |
| Workspace overview | Registered projects, trace counts, index status, last import |
| Runs | Run list, status, duration, session/group links |
| Sessions | Session index, activity summaries |
| Suites | Suite config, case status, failure diff |
| Checks / evals | Deterministic check and eval results |
| Observations | Observed-outcome summaries |
| Guardrails / circuits | Policy and circuit warnings |
| Redaction status | Share-safety posture per project (structural hints, not certification) |
| Search | Text/filter search over indexed metadata |
| Diff | Regression diff between runs or suite cases |
| Reports | Existing report artifacts |
| Bundle export | Trigger read-only bundle assembly/download hints (no upload) |

Chunk phasing maps to [V6.0.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.0.0-EXECUTION-PLAN.md): scaffold → workspace/import + core views → search/diff/reports/observations → auth/binding → bundle export + release readiness.

---

## 3. Non-goals (v6.0.0)

```text
No maintainer-hosted cloud / SaaS
No default upload or telemetry
No write/mutation routes (ingest deferred to v6.1)
No Postgres or SQLite driver in root or core
No trace schema change
No replay / cassette execution
No raw chain-of-thought capture in UI
No VS Code Marketplace coupling (unchanged separate gate)
No plugin marketplace (v6.2 convention only)
```

Client-hosted ingestion (HTTP ingest, file-drop, GitHub artifact import) is **v6.1.0**, explicitly disabled by default, and out of scope for this RFC's v6.0 implementation chunks.

---

## 4. Product boundary

```text
Self-hosted only
Localhost by default
Read-only routes
Explicit opt-in for non-localhost binding and auth
JSONL + workspace.json remain source of truth
Studio DB is derived and rebuildable
```

Studio complements — does not replace — the existing `agent-inspect viewer` (single-directory / single-suite localhost server). Viewer stays lightweight and dependency-minimal; Studio targets multi-project team analysis with optional shared storage.

---

## 5. Package boundary

| Layer | Owns | Must not own |
| ----- | ---- | ------------ |
| `@agent-inspect/studio` | HTTP server, static UI, studio DB schema/migrations, workspace import orchestration, read-only route handlers | trace writing, provider SDKs, ingest endpoints, cloud sync |
| `agent-inspect` CLI | `studio` command wiring (delegates to studio when installed) | studio UI, DB drivers, Postgres |
| `agent-inspect/readers` | trace normalization | HTTP server, DB |
| `@agent-inspect/index-sqlite` | per-project disposable index | studio multi-project registry |
| `@agent-inspect/viewer` | single-project localhost viewer | studio multi-project UI |

**Root dependency impact:** none. DB drivers (`better-sqlite3`, optional `pg` or equivalent) are confined to `@agent-inspect/studio`.

---

## 6. CLI surface

```bash
agent-inspect studio
agent-inspect studio --workspace ./studio-workspace.json
agent-inspect studio --port 7340 --host 127.0.0.1
agent-inspect studio --db ./.agent-inspect/studio.db
agent-inspect studio --db postgres://user:pass@host:5432/agent_inspect
agent-inspect studio --server          # explicit non-localhost bind (requires warning + docs)
agent-inspect studio --auth basic      # optional basic auth (v6.0-4)
agent-inspect studio --password-env STUDIO_PASSWORD
```

| Flag | Default | Notes |
| ---- | ------- | ----- |
| `--workspace` | auto-discover | Studio registry manifest (see §7) |
| `--host` | `127.0.0.1` | Refuse `0.0.0.0` unless `--server` |
| `--port` | `7340` | Distinct from viewer default `7337` |
| `--db` | `./.agent-inspect/studio.db` | `sqlite:` path or `postgres://` URL |
| `--open` | false | Open browser locally only |
| `--auth` | `none` | `none` \| `basic` when enabled |
| `--password-env` | — | Env var for basic-auth password |

JSON mode and stable exit codes follow existing CLI conventions.

---

## 7. Multi-project workspace model

Studio reads a **studio registry** (separate from per-project `.agent-inspect/workspace.json`) that lists registered projects:

```json
{
  "schemaVersion": "1.0",
  "name": "platform-team",
  "projects": [
    {
      "id": "support-agent",
      "path": "/abs/or/relative/path/to/project",
      "label": "Support Agent"
    }
  ],
  "import": {
    "ciArtifactsDir": "./imports/ci",
    "bundlesDir": "./imports/bundles"
  }
}
```

### Rules

- Each `projects[].path` must resolve to a directory containing `.agent-inspect/workspace.json` (v4 layout) or be adoptable via existing workspace discovery.
- Path traversal guards apply to all configured paths.
- Import directories are **read-only inputs** in v6.0 (scan + register); automated ingest is v6.1.
- Unknown `schemaVersion` values are rejected conservatively with a clear error.

Studio does **not** mutate project traces, workspace manifests, or JSONL files.

---

## 8. Storage model

### SQLite (default)

- File-backed DB under `.agent-inspect/studio.db` (or `--db` override).
- Stores: project registry snapshot, import bookkeeping, denormalized run/session/suite/check metadata for fast list/search.
- **Disposable:** deleting the DB never affects JSONL; studio rebuilds from workspace + trace scan on next start or explicit `studio import --rebuild`.

### Postgres (optional, team deployments)

- Activated only via `--db postgres://...` in the studio package.
- Same schema as SQLite; migrations are package-scoped.
- Driver is optional peer/dependency of `@agent-inspect/studio` only — never root/core.
- Intended for teams that already run Postgres internally; not required for local dev.

### Relationship to `@agent-inspect/index-sqlite`

Per-project SQLite indexes (v4.1) remain optional accelerators for CLI queries. Studio may **read** an existing per-project index when fresh, or derive its own studio DB rows from the canonical reader pipeline. Studio must not require `@agent-inspect/index-sqlite` to be installed.

---

## 9. Read-only API (v6.0)

All routes are **GET/HEAD** only. Responses are bounded JSON or static assets. No request bodies that mutate state.

| Route | Purpose |
| ----- | ------- |
| `GET /api/health` | `{ ok, readOnly: true, mode: "studio", db, projects }` |
| `GET /api/projects` | Registered projects + summary stats |
| `GET /api/projects/:id/runs` | Run list (bounded, paginated) |
| `GET /api/projects/:id/sessions` | Session index |
| `GET /api/projects/:id/suites` | Suite configs + last results |
| `GET /api/projects/:id/checks` | Check results |
| `GET /api/projects/:id/evals` | Eval results |
| `GET /api/projects/:id/observations` | Observation summaries |
| `GET /api/projects/:id/guardrails` | Guardrail / circuit status |
| `GET /api/projects/:id/redaction` | Redaction profile hints |
| `GET /api/search` | Cross-project metadata search (query params) |
| `GET /api/diff` | Regression diff (run or suite case ids) |
| `GET /api/reports` | Report artifact listing |
| `GET /api/bundles/export` | Bundle export manifest / download (read-only assembly) |

Non-GET methods return `405`. Structural summaries only in list endpoints; full trace payloads remain bounded per existing viewer limits.

---

## 10. Security

### Network

- **Default bind:** `127.0.0.1` only.
- **`--server` / `0.0.0.0`:** explicit opt-in; startup must log a prominent warning that traces may be exposed on the network.
- **No default outbound network** from studio process (no telemetry, no maintainer callback).

### Authentication (v6.0-4 chunk)

- Default: no auth on localhost (same posture as viewer).
- Optional **HTTP Basic** auth when `--auth basic` and `--password-env` (or config file) are set.
- Auth is **required** when binding to non-localhost interfaces unless maintainer security review explicitly documents an exception (manual gate).
- Passwords never logged; env-var indirection only in v6.0.

### Data exposure

- Redaction profiles surfaced as hints; studio does not certify share-safety.
- Path traversal guards on all filesystem reads.
- Bounded response sizes; oversized inputs rejected safely.
- HTML responses escaped per existing viewer patterns.

### Self-host boundary confirmation

```text
No maintainer-operated service
No default upload
No hidden telemetry
Customer owns the process, DB, and network exposure choices
```

---

## 11. Import and CI artifacts (v6.0)

v6.0 supports **manual / filesystem import** only:

- Scan `import.ciArtifactsDir` and `import.bundlesDir` from the studio registry.
- Register imported bundle contents as read-only evidence linked to projects.
- No HTTP ingest endpoint in v6.0 (v6.1, disabled by default).

---

## 12. Compatibility

- **Additive package.** No changes to global APIs, JSONL schema, or workspace manifest `1.0`.
- Existing `agent-inspect viewer` and `serve` commands unchanged.
- v0.1 / v0.2 / v1.0 traces remain readable through existing readers.
- Studio install is optional: `npm install @agent-inspect/studio` (or monorepo workspace link during dev).

---

## 13. Tests (release train)

Per [V6.0.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.0.0-EXECUTION-PLAN.md):

```text
localhost startup
workspace / registry load
sqlite mode
postgres mode (if implemented in v6.0-5 or deferred with clear docs)
auth enabled / disabled localhost
bundle export read-only behavior
non-GET routes rejected
0.0.0.0 bind requires --server
path traversal rejected
```

---

## 14. Fixtures and recipes

- Multi-project workspace fixtures under `fixtures/` or `examples/` (implementation chunks).
- Self-hosting recipe in `docs/SELF-HOSTING.md` (v6.0-5).
- Optional Docker recipe for studio container (customer-built; no maintainer registry required in v6.0).

---

## 15. Manual gates

| Gate | When |
| ---- | ---- |
| **First `@agent-inspect/studio` npm publication** | Before v6.0.0 release; Trusted Publishing setup required |
| **Non-localhost binding + auth defaults** | Security review before changing defaults |
| **Postgres driver inclusion** | Package-scoped approval; document optional install |

---

## 16. Implementation phasing

| Chunk | Deliverable |
| ----- | ----------- |
| **v6.0-0** (this doc) | Architecture, security, self-host boundary |
| **v6.0-1** | Package scaffold, localhost server shell, health route |
| **v6.0-2** | Registry import, runs/sessions/suites/checks views |
| **v6.0-3** | Search, diff, reports, observations, guardrails, redaction views |
| **v6.0-4** | Optional basic auth, `--server` binding controls |
| **v6.0-5** | Bundle export, `docs/SELF-HOSTING.md`, release readiness |

---

## 17. Success criteria

- A team can run `agent-inspect studio` locally and browse multiple registered projects without AgentInspect hosting anything.
- All routes are read-only; JSONL remains authoritative.
- SQLite works out of the box; Postgres is optional and package-scoped.
- No new root/core dependencies; no default upload.
