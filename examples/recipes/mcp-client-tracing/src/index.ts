import { inspectRun } from "agent-inspect";
import { wrapMcpClient } from "@agent-inspect/mcp";

const traceDir = "./.agent-inspect-runs";

const client = wrapMcpClient(
  {
    async listTools() {
      return { tools: [{ name: "search", description: "fixture search tool" }] };
    },
    async callTool({ name, arguments: args }) {
      return {
        content: [{ type: "text", text: `fixture:${name}:${JSON.stringify(args)}` }],
      };
    },
  },
  {
    serverName: "fixture-mcp-server",
    serverUrl: "http://127.0.0.1:7337",
    sessionId: "sess-mcp-recipe-001",
  },
);

await inspectRun(
  "mcp-client-tracing",
  async () => {
    await client.listTools?.();
    await client.callTool({ name: "search", arguments: { query: "sessions" } });
  },
  {
    traceDir,
    metadata: {
      sessionId: "sess-mcp-recipe-001",
      workflowName: "mcp-client-tracing",
    },
  },
);

console.log("MCP client tracing recipe complete");
console.log(`Trace directory: ${traceDir}`);
console.log("");
console.log("Inspect with:");
console.log(`  npx agent-inspect sessions --dir ${traceDir}`);
console.log(`  npx agent-inspect session sess-mcp-recipe-001 --dir ${traceDir} --timeline`);
