# MCP server (read-only)

`@agent-inspect/mcp-server` exposes **read-only** MCP tools over a local trace directory. Distinct from `@agent-inspect/mcp` (client telemetry).

## Quick start

```bash
npx @agent-inspect/mcp-server
# or see examples/recipes/read-only-mcp-server/
```

Configure via environment:

- `AGENT_INSPECT_TRACE_DIR` — trace directory (default `.agent-inspect`)
- `AGENT_INSPECT_MCP_REDACTION_PROFILE` — `share` (default), `strict`, or `local`

## Tools (v6.3+)

| Tool | Purpose |
| ---- | ------- |
| `list_traces` | List runs in trace dir |
| `read_trace` | Bounded events for one run |
| `search_traces` | Deterministic name/search |
| `find_first_error` | First error in timeline |
| `find_slowest_path` | Top slow steps |
| `compare_runs` | Structural diff summary |
| `run_checks` | Deterministic `run.status` check |
| `create_share_safe_report` | Share-profile markdown |
| `summarize_failed_run` | Failure summary + correlation |
| `retrieve_decision_notes` | Decision steps / decisionId |
| `find_failed_observation` | Failed observed outcomes |
| `create_share_safe_bundle` | In-memory redacted bundle |

## Safety defaults

- Share redaction on exports by default
- Advisory only — not compliance certification
- No trace mutation or network fetch

See [MCP-WORKFLOW-V6.3.md](./proposals/MCP-WORKFLOW-V6.3.md) and [READ-ONLY-MCP-SERVER.md](./proposals/READ-ONLY-MCP-SERVER.md).
