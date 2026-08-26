# @agent-inspect/mcp-server

Read-only MCP server for the **local coding-agent debug loop**: list runs, summarize failures, inspect trees, evaluate contracts, and fetch **TraceFacts** (`get_trace_facts`) — without invoking agent tools or mutating traces.


**Support level:** Preview — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- Let Cursor, Claude Code, Codex, Gemini, or other MCP clients inspect local `.agent-inspect/` evidence
- Debug failed trajectories with the same TraceFacts used by CLI checks

## When not to use

- Invoking target-app tools through MCP
- Uploading traces to a remote MCP host / collector
- Expecting the server to edit application code

## Install

```bash
npm install @agent-inspect/mcp-server
# optional helper:
npx agent-inspect mcp configure --client cursor
```

## Example

```bash
npx @agent-inspect/mcp-server --dir .agent-inspect
```

## Flagship tools (read-only)

| Tool | Role |
|------|------|
| `list_recent_runs` / `list_recent_failures` | Browse local runs |
| `get_run_summary` / `get_execution_tree` | Bounded summaries |
| `get_first_causal_failure` | Deterministic first causal failure |
| `get_contract_failures` | TraceContract / check failures |
| `get_trace_facts` | TraceFacts / semantic parity summary |
| `compare_runs` | Structural diff |
| `create_share_checked_evidence` | Share-gated Evidence package |

### First causal failure ambiguity

Unlinked failures remain unrelated. `get_first_causal_failure` does not infer
causal parents from event adjacency or timing alone, so ambiguous relationships
remain explicit rather than being fabricated.

Results are redacted (share profile by default), bounded, and deterministic for the same inputs.

## Privacy

- Reads local trace directory only
- Tool results go through a share-profile redaction / size boundary
- Exposes configured local evidence to the **connected MCP client** — treat that client as a trust boundary
- No trace mutation; no agent tool invocation; no default upload

## Limitations

- Preview surface — tool catalog and bounds may evolve
- Not a gateway or remote upload service
- Not a substitute for hosted APM

## Docs

- [CODING-AGENT-LOOP.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CODING-AGENT-LOOP.md)
- [TRACE-FACTS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/TRACE-FACTS.md)
- [NO-EGRESS-POLICY.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NO-EGRESS-POLICY.md)

## Troubleshooting

- **Empty resources:** Confirm `--dir` points at JSONL traces
- **Security:** Do not expose server beyond localhost without redaction review

## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
