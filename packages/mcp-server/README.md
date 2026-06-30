# @agent-inspect/mcp-server

Read-only MCP server exposing local trace listings (no tool invocation, no mutation).

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
- No unredacted payload export by default
- No trace mutation

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

`3.5.x`

## License

MIT
