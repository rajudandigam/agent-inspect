# MCP server (read-only)

`@agent-inspect/mcp-server` exposes **read-only** MCP tools over a local trace directory. Distinct from `@agent-inspect/mcp` (client telemetry).

For the **6.11+ coding-agent debug loop** (flagship tools, causal failure, configure CLI, Evidence v2), see [CODING-AGENT-LOOP.md](./CODING-AGENT-LOOP.md) and [coding-agent-instructions/](./coding-agent-instructions/).

> This is **role 3** of three MCP workflows — reading evidence you already have.
> It does not trace the connecting assistant. See
> [MCP-ROLES.md](./MCP-ROLES.md) for how it differs from MCP client tracing
> (`@agent-inspect/mcp`) and from instrumenting an MCP server.

## Quick start

```bash
npx @agent-inspect/mcp-server --dir .agent-inspect
# bin name: agent-inspect-mcp-server
# or see examples/recipes/read-only-mcp-server/
```

Configure via environment:

- `AGENT_INSPECT_TRACE_DIR` — trace directory (default `.agent-inspect`)
- `AGENT_INSPECT_MCP_REDACTION_PROFILE` — `share` (default), `strict`, or `local`

## Tools (v6.11 flagship + v6.3 legacy)

Flagship names (preferred): `list_recent_runs`, `list_recent_failures`, `get_run_summary`, `get_execution_tree`, `get_first_causal_failure`, `get_slowest_path`, `get_contract_failures`, `get_failed_observations`, `compare_runs`, `create_share_checked_evidence`, `get_adapter_diagnostics`.

Legacy names remain available: `list_traces`, `read_trace`, `search_traces`, `find_first_error`, `find_slowest_path`, `run_checks`, `create_share_safe_report`, `summarize_failed_run`, `retrieve_decision_notes`, `find_failed_observation`, `create_share_safe_bundle`.

## Safety defaults

- Share redaction on exports by default
- Advisory only — not compliance certification
- No trace mutation or network fetch

See [MCP-WORKFLOW-V6.3.md](./proposals/MCP-WORKFLOW-V6.3.md) and [READ-ONLY-MCP-SERVER.md](./proposals/READ-ONLY-MCP-SERVER.md).
