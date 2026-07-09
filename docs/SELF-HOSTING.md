# Self-hosting AgentInspect Studio

AgentInspect Studio is a **customer-owned**, **read-only** analyzer for multi-project workspaces. It is not a maintainer-hosted service.

## Install

```bash
npm install agent-inspect @agent-inspect/studio
```

## Quick start (localhost)

```bash
npx agent-inspect studio --workspace ./studio-registry.json
```

Defaults:

- bind: `127.0.0.1:7340`
- database: `./.agent-inspect/studio.db` (SQLite, disposable cache)
- JSONL + `workspace.json` remain canonical

## Studio registry

Create `studio-registry.json` beside your team workspace root:

```json
{
  "schemaVersion": "1.0",
  "name": "platform-team",
  "projects": [
    { "id": "support-agent", "path": "/path/to/project", "label": "Support Agent" }
  ],
  "import": {
    "ciArtifactsDir": "./imports/ci",
    "bundlesDir": "./imports/bundles"
  }
}
```

Each `projects[].path` must contain `.agent-inspect/workspace.json` (v4 layout).

Optional **file-drop ingest** (v6.1+, disabled by default):

```bash
npx agent-inspect studio import drop --workspace ./studio-registry.json
npx agent-inspect studio --ingest file-drop --workspace ./studio-registry.json
```

Registry `import.fileDropDir` points at the watched folder; allowlisted files (`.jsonl`, `.suite.json`, `.tgz`, `.zip`) copy into `import.ciArtifactsDir` / `import.bundlesDir` with idempotent SQLite bookkeeping. Ingest stays off until you pass `--ingest file-drop` or run `studio import drop`.

**GitHub Actions artifacts** (v6.1+, operator-initiated pull only):

```bash
export GITHUB_TOKEN=...   # actions:read on your repo
npx agent-inspect studio import github \
  --repo owner/name \
  --run-id 123456789 \
  --artifact ci-artifacts \
  --workspace ./studio-registry.json
```

Downloads the artifact zip into `import.bundlesDir`, records idempotent ingest bookkeeping, and refreshes the studio project index. No maintainer GitHub App or AgentInspect proxy — CI tests use checked-in fixture archives only.

**Manual bundle upload** (v6.1+):

```bash
npx agent-inspect bundle <run-id> --profile share --out ./bundle-out
npx agent-inspect studio import bundle --path ./bundle-out --workspace ./studio-registry.json
```

Validates `metadata.json` from a local share-safe bundle directory before copying into `import.bundlesDir`.

**HTTP ingest** (v6.1+, disabled by default):

```bash
export STUDIO_INGEST_TOKEN=$(openssl rand -hex 32)
npx agent-inspect studio --ingest http --ingest-token-env STUDIO_INGEST_TOKEN
# POST /api/ingest/bundle or /api/ingest/artifact with Authorization: Bearer $STUDIO_INGEST_TOKEN
```

HTTP ingest stays off until `--ingest http` or `ingest.http.enabled: true` in the registry. Token required on every POST.

## Ingestion security model (v6.1)

| Control | Behavior |
| ------- | -------- |
| Default | All ingest channels off |
| File-drop | Explicit CLI or `--ingest file-drop` only |
| GitHub | Operator-initiated pull with their token only |
| HTTP POST | Explicit enable + `STUDIO_INGEST_TOKEN` (constant-time validation) |
| Body size | Bounded (default 50MB) |
| Paths | Traversal guards; server chooses dest under registry `import.*` |
| Secrets | Tokens never logged; safe error messages only |
| Network | Studio never phones home; no maintainer upload target |
| Data | Imported files are read-only evidence; JSONL canonical |

Combine `--auth basic` when binding beyond localhost. Review imported artifacts with `scan` / `verify-safe` before sharing outside your network.

## Network exposure

- **Default:** localhost only.
- **`--server`:** binds `0.0.0.0` with an explicit startup warning.
- **`--auth basic --password-env STUDIO_PASSWORD`:** optional HTTP Basic auth (recommended for non-localhost).

Studio performs **no default upload**. Read routes are GET-only; optional **ingest POST routes** exist only when HTTP ingest is explicitly enabled (v6.1+).

## API surface (read-only)

| Route | Purpose |
| ----- | ------- |
| `GET /api/health` | Studio status |
| `GET /api/projects` | Registered projects |
| `GET /api/projects/:id/runs` | Run list |
| `GET /api/projects/:id/sessions` | Session index |
| `GET /api/projects/:id/suites` | Suite results |
| `GET /api/projects/:id/checks` | Check summaries |
| `GET /api/search?projectId=&q=` | Metadata search |
| `GET /api/diff?projectId=&left=&right=` | Regression diff |
| `GET /api/bundles/export?projectId=&runId=` | Bundle export hints (CLI assembly) |

## Postgres

Postgres URLs are reserved for team deployments and are **not required** for local use. v6.0 ships SQLite by default in `@agent-inspect/studio` only — never in root/core.

## Related docs

- [SELF-HOSTED-STUDIO-V6.0.md](./proposals/SELF-HOSTED-STUDIO-V6.0.md)
- [CLIENT-HOSTED-INGESTION-V6.1.md](./proposals/CLIENT-HOSTED-INGESTION-V6.1.md)
- [LOCAL-TRACE-WORKSPACE.md](./proposals/LOCAL-TRACE-WORKSPACE.md)
