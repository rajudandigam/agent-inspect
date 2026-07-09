# Client-hosted Ingestion — v6.1.0 RFC

**Status:** Accepted for v6.1.0 train (chunk 0)  
**Baseline:** `agent-inspect@6.0.0`, `@agent-inspect/studio@6.0.0`  
**Related:** [SELF-HOSTED-STUDIO-V6.0.md](./SELF-HOSTED-STUDIO-V6.0.md) · [SHAREABLE-BUNDLES-V4.3.md](./SHAREABLE-BUNDLES-V4.3.md) · [V6.1.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.1.0-EXECUTION-PLAN.md)

Extend **self-hosted Studio** with optional ingestion of CI artifacts and bundles into the operator's Studio instance. **No maintainer cloud. No default upload. Disabled by default.**

---

## 1. Problem

v6.0 Studio reads local registry projects and filesystem import directories, but teams need a controlled way to **bring CI evidence into their own Studio** — file drops, GitHub Actions artifacts, optional HTTP POST from CI, and manual bundle uploads — without AgentInspect operating any hosted ingest service.

---

## 2. Goals (v6.1.0)

All ingestion lives in **`@agent-inspect/studio` only** (never root/core).

| Input | Description |
| ----- | ----------- |
| **File-drop directory** | Watched/imported folder under studio registry `import.*` |
| **GitHub artifact importer** | Pull or unpack a GitHub Actions artifact (local path or API with operator token) |
| **HTTP ingest endpoint** | Optional `POST` routes on the Studio server |
| **CI upload token** | Token minted by the self-hosted Studio instance; required for HTTP ingest |
| **Manual bundle upload** | Operator uploads a share-safe bundle via Studio UI/API |

### Enablement rules

- **Everything disabled by default.** No HTTP ingest listener, no background watcher, until explicitly enabled.
- Operator enables per channel via CLI flags and/or studio registry config.
- JSONL and workspace manifests remain canonical; ingest only **registers read-only evidence** in the studio DB and import bookkeeping tables.

---

## 3. Non-goals (v6.1.0)

```text
No ingestion in agent-inspect root package
No maintainer-hosted ingest / SaaS upload target
No default-enabled HTTP endpoints
No automatic outbound upload from user agents
No trace mutation or replay execution
No Postgres requirement for ingest
No public unauthenticated ingest
```

---

## 4. Product boundary

```text
Self-hosted only
Explicit opt-in per ingest channel
Token required for HTTP ingest
File-drop and GitHub import are local/operator-initiated
Imported content is read-only evidence
Studio never phones home
```

v6.0 read-only GET routes remain unchanged. v6.1 adds **bounded write routes** only on the Studio package when ingest is explicitly enabled.

---

## 5. Package boundary

| Layer | Owns | Must not own |
| ----- | ---- | ------------ |
| `@agent-inspect/studio` | ingest modules, token mint/validate, import orchestration, optional POST routes | root CLI ingest, cloud relay, trace writers |
| `agent-inspect` CLI | no new ingest surface in v6.1 | HTTP server, ingest tokens |
| `agent-inspect/readers` | normalize ingested bundle/trace content | ingest transport |

---

## 6. Studio registry extensions (v6.1)

Additive fields on `studio-registry.json`:

```json
{
  "schemaVersion": "1.0",
  "name": "platform-team",
  "projects": [],
  "import": {
    "ciArtifactsDir": "./imports/ci",
    "bundlesDir": "./imports/bundles",
    "fileDropDir": "./imports/drop",
    "enabled": false
  },
  "ingest": {
    "http": {
      "enabled": false,
      "path": "/api/ingest",
      "tokenEnv": "STUDIO_INGEST_TOKEN"
    },
    "github": {
      "enabled": false,
      "tokenEnv": "GITHUB_TOKEN"
    },
    "bundleUpload": {
      "enabled": false,
      "maxBytes": 52428800
    }
  }
}
```

Unknown `ingest` keys are ignored with a warning; `ingest.http.enabled` defaults to `false`.

---

## 7. CLI surface (studio package)

```bash
agent-inspect studio --ingest file-drop          # enable file-drop scan on startup
agent-inspect studio --ingest http               # enable HTTP ingest (requires token)
agent-inspect studio --ingest-token-env STUDIO_INGEST_TOKEN
agent-inspect studio import drop --dir ./imports/drop
agent-inspect studio import github --run-id <id> --artifact <name>
agent-inspect studio import bundle --path ./bundle.tgz
```

`studio import` subcommands are optional convenience wrappers; core logic stays in `@agent-inspect/studio`.

---

## 8. HTTP ingest (disabled by default)

When `ingest.http.enabled` or `--ingest http`:

| Route | Method | Auth | Purpose |
| ----- | ------ | ---- | ------- |
| `/api/ingest/bundle` | POST | Bearer or `X-AgentInspect-Token` | Accept bounded bundle upload |
| `/api/ingest/artifact` | POST | same | Accept CI artifact tarball |

Rules:

- Reject all ingest routes when HTTP ingest is **not** explicitly enabled (404 or 403 with safe message).
- Validate token on every request; constant-time compare; never log token values.
- Bounded body size; reject oversize with 413.
- No arbitrary file paths from client — server chooses extract dir under registry `import` paths with traversal guards.
- Responses are JSON only; no redirect, no SSRF callbacks.

**Manual gate:** HTTP ingest must never become enabled by default without maintainer security review.

---

## 9. File-drop importer

- Scan `import.fileDropDir` (or `--ingest file-drop`) for new files matching allowlist: `.jsonl`, `.tgz`, `.zip`, suite artifacts.
- Move or copy into `import.ciArtifactsDir` / `import.bundlesDir` with idempotent bookkeeping in studio DB.
- Never delete source traces; optional archive subfolder after successful import.
- Safe errors only (no stack traces to HTTP clients).

---

## 10. GitHub artifact importer

- Operator supplies `GITHUB_TOKEN` (env) with `actions:read` on their repo only.
- CLI/API: `import github --repo owner/name --run-id <id> --artifact <name>` downloads to local import dir, then runs existing registry import.
- No maintainer GitHub App; no AgentInspect-operated proxy.
- Fixture-driven tests use checked-in tarball samples (no live network in CI).

---

## 11. Manual bundle upload

- `POST /api/ingest/bundle` when enabled, or `studio import bundle --path`.
- Validates bundle manifest shape (share-safe bundle RFC); rejects malformed input.
- Registers bundle as read-only evidence linked to a project id in registry.
- Does not execute checks/evals inside uploaded content beyond existing read paths.

---

## 12. Token model

- Studio mints or accepts a single shared ingest secret via env (`STUDIO_INGEST_TOKEN`).
- Operator generates token out-of-band (`openssl rand -hex 32`); Studio never generates network callbacks.
- Token required for all HTTP ingest when enabled.
- Rotation: change env + restart Studio; old token invalid immediately.

---

## 13. Security

| Control | Requirement |
| ------- | ----------- |
| Default | All ingest off |
| HTTP | Explicit enable + token + size bounds |
| Auth overlap | HTTP ingest requires token even on localhost when enabled |
| Path safety | Traversal guards on all import paths |
| Errors | Safe messages; no secrets in logs |
| Network | No outbound upload; GitHub import is operator-initiated pull only |
| Data | Imported content treated as untrusted input; validate before index |

---

## 14. Compatibility

- Additive to `@agent-inspect/studio` @ 6.1.x.
- v6.0 registry files without `ingest` block continue to work (ingest off).
- No JSONL schema change.
- Root `agent-inspect` package unchanged.

---

## 15. Tests (release train)

```text
HTTP ingest disabled by default
explicit enable required for POST routes
token validation (valid / missing / wrong)
file-drop import idempotency
GitHub artifact fixture import
bundle upload validation
oversize rejection
path traversal rejected
safe error messages
```

---

## 16. Implementation phasing

| Chunk | Deliverable |
| ----- | ----------- |
| **v6.1-0** (this doc) | Ingestion + security model |
| **v6.1-1** | File-drop importer |
| **v6.1-2** | GitHub artifact importer |
| **v6.1-3** | HTTP ingest + token validation |
| **v6.1-4** | Manual bundle upload flow |
| **v6.1-5** | Security docs + release readiness |

---

## 17. Success criteria

- Operator can enable file-drop or HTTP ingest on **their** Studio only.
- HTTP ingest is off until explicitly enabled and authenticated.
- No new root dependencies or routes.
- No maintainer-operated upload infrastructure.
