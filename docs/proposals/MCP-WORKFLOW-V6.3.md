# MCP coding-agent workflows — v6.3.0 RFC

**Status:** Accepted for v6.3.0 train  
**Baseline:** `agent-inspect@6.2.0`  
**Related:** [READ-ONLY-MCP-SERVER.md](./READ-ONLY-MCP-SERVER.md) · [V6.3.0-EXECUTION-PLAN.md](../implementation/release-trains/V6.3.0-EXECUTION-PLAN.md)

Extend the read-only `@agent-inspect/mcp-server` tool catalog for coding-agent workflows: summarize failures, decision notes, failed observations, and in-memory share-safe bundles.

## Tool catalog (v6.3 additions)

| Tool | Description |
| ---- | ----------- |
| `summarize_failed_run` | Human-readable failure summary with correlation metadata |
| `retrieve_decision_notes` | Decision steps and `decisionId` attributes |
| `find_failed_observation` | Failed observed outcomes |
| `create_share_safe_bundle` | In-memory bundle manifest + redacted report/tree exports |

Existing v2.6 tools (`list_traces`, `read_trace`, `search_traces`, `find_first_error`, `find_slowest_path`, `compare_runs`, `run_checks`, `create_share_safe_report`) remain unchanged.

## Safety

- Read-only; no trace mutation, replay, or code edits
- Default `redactionProfile: share` for exports
- Bounded responses (`maxEvents` cap)
- No hidden network beyond MCP stdio transport

## Non-goals

- Auto-fix or remediation tools
- Unredacted output by default
- Hosted MCP gateway
