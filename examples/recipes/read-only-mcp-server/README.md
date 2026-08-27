# Read-only MCP server

Call `@agent-inspect/mcp-server` read-only tools against a local trace directory. No network, no trace mutation.

```bash
pnpm install
pnpm start
```

Tools are advisory and use the `share` redaction profile by default.

## Which MCP role is this?

This recipe is role 3 (AgentInspect read-only MCP). See [MCP-ROLES.md](../../../docs/MCP-ROLES.md) for the three roles and what each can observe.
