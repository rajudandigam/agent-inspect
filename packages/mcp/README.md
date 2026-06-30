# @agent-inspect/mcp

MCP **client** tool-call tracing for AgentInspect (list/call lifecycle).

## When to use

- Your agent uses an MCP client and you need local tool-call steps

## When not to use

- Running an MCP server (use your server stack)
- Gateway/proxy products

## Install

```bash
npm install agent-inspect @agent-inspect/mcp
```

## Example

```ts
import { wrapMcpClient } from "@agent-inspect/mcp";

const traced = wrapMcpClient(mcpClient, { traceDir: ".agent-inspect" });
await traced.callTool({ name: "search", arguments: {} });
```

## Privacy

- Local JSONL only; no MCP traffic sent to AgentInspect cloud (there is none)

## API

| Export | Purpose |
| ------ | ------- |
| `wrapMcpClient` | Trace list/call tool operations |

## CLI

`npx agent-inspect view` · `search --kind tool`

## Docs

- [Adapters](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTERS.md)

## Troubleshooting

- **Missing list_tools steps:** Ensure client goes through wrapped instance

## Version

`agent-inspect@3.5.x`

## License

MIT
