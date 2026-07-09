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

## Network exposure

- **Default:** localhost only.
- **`--server`:** binds `0.0.0.0` with an explicit startup warning.
- **`--auth basic --password-env STUDIO_PASSWORD`:** optional HTTP Basic auth (recommended for non-localhost).

Studio performs **no default upload** and exposes **GET-only** routes.

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
- [LOCAL-TRACE-WORKSPACE.md](./proposals/LOCAL-TRACE-WORKSPACE.md)
