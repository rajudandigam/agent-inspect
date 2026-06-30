# Read-only MCP server — v2.6.0 RFC

**Status:** Accepted for v2.6.0 train (chunk 0) — design only  
**Audience:** Maintainers, IDE/MCP integrators  
**Baseline:** `agent-inspect@2.5.0`  
**Related:** [LOCAL-VIEWER.md](./LOCAL-VIEWER.md) · [@agent-inspect/mcp](../packages/mcp/) (client telemetry) · [V2.6.0-EXECUTION-PLAN.md](../implementation/release-trains/V2.6.0-EXECUTION-PLAN.md)

This RFC defines a **read-only** MCP **server** that exposes AgentInspect traces as safe tools for IDEs. It is distinct from `@agent-inspect/mcp` (v2.4 **client** telemetry). No tool invocation, trace mutation, or unredacted defaults.

---

## 1. Problem

IDE agents (Cursor, VS Code) can consume MCP tools. Users want to **query local traces** from an IDE without uploading data. v2.4 added MCP **client** tracing; v2.6 adds MCP **server** read tools only when demand for optional surfaces is documented.

---

## 2. Goals (v2.6.0)

- Optional `@agent-inspect/mcp-server` package.
- Stdio MCP server exposing read-only tools over local trace directories.
- All tools return bounded JSON; redaction profile `share` by default for text fields.
- Reuse readers, checks, session helpers — no duplicate parsers.

## 3. Non-goals (v2.6.0)

- No trace mutation, replay, auto-fix, or code edits.
- No tool execution against user agents.
- No unredacted prompts/outputs by default.
- No hosted MCP gateway or remote trace fetch.
- No coupling to a specific IDE vendor SDK in root/core.

---

## 4. Tool catalog (read-only)

| Tool | Description |
| ---- | ----------- |
| `list_traces` | List runs/files in configured trace dir |
| `read_trace` | Bounded tree/events for one run |
| `search_traces` | Deterministic search (same semantics as CLI) |
| `find_first_error` | First error event path |
| `find_slowest_path` | Slowest span/path summary |
| `compare_runs` | Structural diff summary |
| `run_checks` | Deterministic check results JSON |
| `create_share_safe_report` | Markdown/JSON report with `share` redaction profile |

Every tool is **read-only**; arguments are ids/paths/flags only.

---

## 5. Configuration

```json
{
  "traceDir": ".agent-inspect-runs",
  "redactionProfile": "share",
  "maxEvents": 500
}
```

Environment overrides: `AGENT_INSPECT_TRACE_DIR`, `AGENT_INSPECT_MCP_REDACTION_PROFILE`.

---

## 6. Safety defaults

- Default `redactionProfile: "share"` for tool outputs.
- Refuse paths outside resolved trace directory.
- Cap event counts and string lengths in responses.
- Document that tools are advisory, not compliance certification.

---

## 7. Package boundary

| Package | Role |
| ------- | ---- |
| `@agent-inspect/mcp-server` | MCP server process + tool handlers |
| `@agent-inspect/mcp` | Client telemetry only (v2.4) — unchanged |
| `agent-inspect` CLI | May add thin `mcp-server` launcher in recipe/docs |

No new root/core dependencies on MCP SDK if duck-typed protocol suffices (match v2.4 client approach).

---

## 8. Compatibility

- Optional package; not linked into root runtime.
- Old traces readable without migration.
- Recipe: `examples/recipes/read-only-mcp-server/`.

---

## 9. IDE decision (chunk 3)

IDE extension: see [VSCODE.md](../VSCODE.md). Historical decision: [archive/public/IDE-SURFACES.md](../archive/public/IDE-SURFACES.md).
