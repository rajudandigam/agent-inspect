# Shareable Trace Bundles — v4.3.0 RFC

**Status:** Accepted for v4.3.0 train (chunk 0) — design only in this chunk  
**Audience:** Maintainers, CLI implementers, security reviewers  
**Baseline:** `agent-inspect@4.2.0`  
**Related:** [OPTIONAL-LOCAL-INDEX.md](./OPTIONAL-LOCAL-INDEX.md) · [SESSIONS-AND-ACTIVITY-V4.2.md](./SESSIONS-AND-ACTIVITY-V4.2.md) · [V4.3.0-EXECUTION-PLAN.md](../implementation/release-trains/V4.3.0-EXECUTION-PLAN.md)

This RFC defines **share-safe, offline trace bundles** for PRs, incident reviews, and CI artifacts. Bundles are **derived copies** — original traces are never mutated.

---

## 1. Problem

Developers can already redact, verify-safe, export HTML, and generate CI artifacts — but assembling PR-ready evidence still requires multiple commands and manual file collection. v4.3 adds a single **`agent-inspect bundle`** command that produces a predictable folder with redacted content and automatic safety verification.

---

## 2. Goals (v4.3.0)

- One command to create a **local folder bundle** from a run id, session id, or `--since` window.
- Default **`share`** redaction profile; **`strict`** available for external sharing.
- Automatic **`verify-safe`** semantics before write; fail on **`UNSAFE`** unless `--allow-unsafe`.
- **Never mutate** source trace files.
- Offline **`trace.html`**, **`summary.md`**, and machine-readable sidecars.
- Path-traversal guards on output paths inside workspaces.
- JSON mode for automation.

## 3. Non-goals (v4.3.0)

- No zip/tar runtime dependency (folder output; `.zip` suffix on `--out` is stripped to a directory name).
- No upload, hosted bundle registry, or SaaS sharing.
- No mutation of source traces or workspace manifests.
- No new trace `schemaVersion`.
- No default network I/O.

---

## 4. Commands

```bash
agent-inspect bundle <runId> [--profile share] [--out ./bundle-dir]
agent-inspect bundle --session <sessionId> [--profile share]
agent-inspect bundle --since 24h [--profile strict]
agent-inspect bundle <runId> --allow-unsafe   # override UNSAFE failure
```

| Flag | Default | Meaning |
| ---- | ------- | ------- |
| `--profile` | `share` | `local`, `share`, or `strict` redaction for exported copies |
| `--out` | workspace `bundles/` or `./agent-inspect-bundle-<runId>` | Output directory (folder) |
| `--allow-unsafe` | off | Write bundle even when verify-safe reports `UNSAFE` |
| `--dir` | resolved trace dir | Trace directory for run/session lookup |
| `--json` | off | Print deterministic JSON manifest |

Exactly one **target mode** is required:

1. Positional `<runId>`
2. `--session <sessionId>`
3. `--since <duration>` (e.g. `24h`, `7d`)

---

## 5. Bundle layout (folder)

```text
<out>/
  trace.html                 # primary offline report (multi-run: index + links)
  trace.jsonl                # redacted JSONL (single run or concatenated)
  summary.md                 # human summary across runs
  metadata.json              # bundle manifest
  check-results.json         # verify-safe results per run
  eval-results.json          # placeholder when no eval artifacts requested
  redaction-report.json      # detector findings from redaction pass
  performance-summary.json   # placeholder when no perf artifacts requested
  assets/
    runs/<runId>.html        # per-run offline HTML (multi-run)
    runs/<runId>.jsonl       # per-run redacted JSONL (multi-run)
```

For a **single run**, `trace.jsonl` and `trace.html` are the primary artifacts; `assets/runs/` mirrors the same content for consistent multi-run layout.

---

## 6. Safety contract

1. **Read** source trace(s) read-only.
2. **Assess** with the same rules as `verify-safe` (raw content, redaction markers, secret patterns, oversized attributes, share-profile redaction detectors).
3. If aggregate status is **`UNSAFE`** and `--allow-unsafe` is not set → **exit 1**, no bundle write (except diagnostics in JSON mode).
4. **Redact** exported copies with `--profile` (default `share`).
5. **Write** only under `--out`; workspace-relative paths use traversal guards.
6. Original trace files: **read-only**, never opened for write.

### Safe status aggregation

| Per-run status | Bundle aggregate |
| -------------- | ---------------- |
| Any `UNSAFE` | `UNSAFE` (fail unless `--allow-unsafe`) |
| Any `UNKNOWN` | `UNKNOWN` (fail unless `--allow-unsafe`) |
| Any `SAFE WITH WARNINGS` | `SAFE WITH WARNINGS` |
| All `SAFE` | `SAFE` |

Metadata `safeStatus` uses underscore form: `SAFE_WITH_WARNINGS`.

---

## 7. Metadata (`metadata.json`)

```json
{
  "createdAt": "2026-07-08T00:00:00.000Z",
  "agentInspectVersion": "4.3.0",
  "redactionProfile": "share",
  "sourceTraceCount": 2,
  "runIds": ["run-a", "run-b"],
  "sessionId": "sess-1",
  "since": "24h",
  "safeStatus": "SAFE_WITH_WARNINGS",
  "files": ["trace.html", "trace.jsonl", "summary.md", "metadata.json"],
  "note": "Generated locally by AgentInspect. Review before sharing."
}
```

---

## 8. Session and `--since` resolution

- **`--session`**: resolve via `buildSessionIndex` (same rules as v4.2 sessions CLI); bundle all `session.runIds` in stable order.
- **`--since`**: include runs whose `startedAt` (or `lastActivity` fallback) is within the duration window.
- Index acceleration from `@agent-inspect/index-sqlite` is optional; scan fallback matches sessions CLI.

---

## 9. Tests

- Bundle creation (single run, share profile)
- Strict profile redaction in output
- UNSAFE failure without `--allow-unsafe`
- `--allow-unsafe` override writes bundle
- Folder output; `.zip` suffix stripped
- No mutation of source trace mtime/content
- Path traversal rejection for workspace-relative `--out`
- Redaction report lists detectors without leaking secrets
- JSON manifest deterministic
- Recipe smoke (`shareable-bundle-basic`)

---

## 10. Package surface

- **Core** (`@agent-inspect/core/advanced`): `resolveBundleRunIds`, manifest/summary helpers, safe-status aggregation.
- **CLI**: `bundle` command orchestration, file writes, safety assessment.
- **No new root exports.**

---

## 11. Security / network

- Redaction before export; verify-safe before write.
- Bounded previews in reports; no full prompt capture by default.
- No network calls in bundle path.
