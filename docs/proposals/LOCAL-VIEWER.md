# Local viewer — v2.6.0 RFC

**Status:** Accepted for v2.6.0 train (chunk 0) — design only  
**Audience:** Maintainers, CLI implementers  
**Baseline:** `agent-inspect@2.5.0`  
**Related:** [ADOPTION-METRICS.md](../product/ADOPTION-METRICS.md) · [READ-ONLY-MCP-SERVER.md](./READ-ONLY-MCP-SERVER.md) · [V2.6.0-EXECUTION-PLAN.md](../implementation/release-trains/V2.6.0-EXECUTION-PLAN.md)

This RFC defines an **optional**, **localhost-only**, **read-only** trace viewer before v2.6 runtime work (`@agent-inspect/viewer`, `agent-inspect serve`). It does **not** introduce cloud hosting, accounts, trace mutation, or upload pipelines.

---

## 1. Problem

AgentInspect excels at CLI inspection, checks, and exports. Teams building multi-run workflows (sessions, checks, eval) increasingly ask for a **visual tree/timeline** without leaving the machine. A hosted dashboard is explicitly out of scope; a **local optional viewer** can complement CLI without violating local-first principles.

---

## 2. Demand gate (v2.6)

Proceed with viewer implementation because v2.x trains delivered:

- session navigation (`sessions` / `session`);
- deterministic checks and eval;
- guardrails/circuit utilities;
- MCP client telemetry;
- retained npm activity on root and adapter packages (see [ADOPTION-METRICS.md](../product/ADOPTION-METRICS.md)).

Viewer remains **optional** — CLI and JSONL remain canonical.

---

## 3. Goals (v2.6.0)

- Optional `@agent-inspect/viewer` package.
- `agent-inspect serve` binds **127.0.0.1** only by default.
- Read-only HTTP routes: tree, timeline, reports, diff summary, check results, session browse.
- Source JSONL on disk remains authoritative; viewer reads through existing readers.
- Safe-sharing status surfaced (redaction profile hints, not certification).

## 4. Non-goals (v2.6.0)

- No cloud hosting, accounts, or multi-tenant product.
- No trace mutation, write APIs, or replay execution.
- No database in root/core; no SQLite.
- No default network upload or external analytics.
- No raw chain-of-thought capture in viewer UI.

---

## 5. Package boundary

| Layer | Owns | Must not own |
| ----- | ---- | ------------ |
| `@agent-inspect/viewer` | static assets, read-only route handlers, localhost server | trace writing, provider SDKs, mutation |
| `agent-inspect` CLI | `serve` command wiring | viewer UI framework in root |
| `agent-inspect/readers` | trace normalization | HTTP server |

---

## 6. CLI surface

```bash
agent-inspect serve --dir ./.agent-inspect-runs --port 7337 --host 127.0.0.1
```

| Flag | Default | Notes |
| ---- | ------- | ----- |
| `--dir` | `.agent-inspect-runs` | Trace directory |
| `--port` | `7337` | Local port |
| `--host` | `127.0.0.1` | Refuse `0.0.0.0` unless explicit opt-in with warning |
| `--open` | false | Open browser locally only |

---

## 7. Read-only routes (v2.6)

| Route | Purpose |
| ----- | ------- |
| `GET /api/traces` | List trace files / run ids |
| `GET /api/trace/:id` | Normalized tree + events (bounded) |
| `GET /api/trace/:id/timeline` | Timeline projection |
| `GET /api/trace/:id/check` | Run deterministic checks (optional query) |
| `GET /api/sessions` | Session index from advanced helpers |
| `GET /api/session/:id` | Session timeline |
| `GET /api/health` | Local health (no external calls) |

All responses are JSON. No POST/PUT/DELETE for trace data.

---

## 8. Security posture

- Bind localhost by default; log warning if user overrides to all interfaces.
- Do not serve arbitrary filesystem paths — only resolved trace dir.
- Apply export-style redaction profiles when rendering text fields in UI payloads.
- No authentication layer (local dev tool); document that shared-network binding is user risk.

---

## 9. Compatibility

- No schema version change.
- Viewer is optional; root package does not depend on it at runtime unless user runs `serve`.
- ESM/CJS/declarations for viewer package match other `@agent-inspect/*` packages.

---

## 10. v2.6 chunk mapping

| Chunk | Deliverable |
| ----- | ----------- |
| 0 | This RFC + MCP server RFC + adoption gate |
| 1 | `@agent-inspect/viewer` + `serve` CLI |
| 2 | Read-only MCP server package |
| 3 | IDE surface decision docs |
| 4 | Docs + release readiness |
