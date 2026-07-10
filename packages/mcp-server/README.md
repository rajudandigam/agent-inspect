# @agent-inspect/mcp-server

Read-only MCP server exposing local trace listings (no tool invocation, no mutation).


**Support level:** Preview — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- Let MCP-compatible clients **read** trace metadata from disk
- Local dev assistants that browse `.agent-inspect/`

## When not to use

- Invoking agent tools through MCP
- Uploading traces to a remote MCP host

## Install

```bash
npm install @agent-inspect/mcp-server
```

## Example

```bash
npx agent-inspect-mcp-server --dir .agent-inspect
```

## Privacy

- Reads local trace directory only
- Tool results go through a share-profile redaction / size boundary
- Exposes configured local evidence to the **connected MCP client** — treat that client as a trust boundary
- No trace mutation; no agent tool invocation

## Limitations

- Preview surface — tool catalog and bounds may evolve
- Not a gateway or remote upload service

## API

CLI entry: read-only resources for trace listing/search.

## CLI

Prefer `agent-inspect list` / `view` for humans; MCP server for tool integrations.

## Docs

- [Root README](https://github.com/rajudandigam/agent-inspect#readme)

## Troubleshooting

- **Empty resources:** Confirm `--dir` points at JSONL traces
- **Security:** Do not expose server beyond localhost without redaction review


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
