# MCP client tracing

Local-only recipe: wrap an MCP **client** so `tools/list` and `tools/call` emit AgentInspect tool steps with `source.type: mcp-client` metadata.

## Scope

- Client telemetry only (no MCP server, gateway, or upload)
- Bounded argument summaries; no raw payload capture by default
- Works with any client matching the `McpClientLike` shape

## Usage

```typescript
import { inspectRun } from "agent-inspect";
import { wrapMcpClient } from "@agent-inspect/mcp";

const traced = wrapMcpClient(mcpClient, {
  serverName: "docs-server",
  serverUrl: process.env.MCP_SERVER_URL,
  sessionId: "sess-123",
});

await inspectRun("agent-with-mcp", async () => {
  await traced.listTools?.();
  await traced.callTool({ name: "search", arguments: { query: "sessions" } });
});
```

Inspect with:

```bash
npx agent-inspect sessions --dir ./.agent-inspect
npx agent-inspect session sess-123 --timeline
```

## Out of scope

- MCP server implementation
- Hosted gateway or broker
- Automatic tool invocation on behalf of the user
