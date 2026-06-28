export interface McpToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface McpListToolsResult {
  tools: McpToolDescriptor[];
}

export interface McpCallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpCallToolResult {
  content?: unknown;
  isError?: boolean;
  structuredContent?: unknown;
}

/**
 * Minimal MCP client surface for local tracing. Compatible with common SDK
 * client shapes without requiring @modelcontextprotocol/sdk at runtime.
 */
export interface McpClientLike {
  listTools?: (params?: unknown) => Promise<McpListToolsResult>;
  callTool: (params: McpCallToolParams) => Promise<McpCallToolResult>;
}

export interface McpClientTracerOptions {
  serverName?: string;
  serverUrl?: string;
  sessionId?: string;
  toolCallIdPrefix?: string;
  maxSummaryLength?: number;
  metadata?: Record<string, unknown>;
}

export interface McpTraceMetadata {
  source: { type: "mcp-client" };
  mcpServerName?: string;
  mcpServerUrlHash?: string;
  sessionId?: string;
  toolName?: string;
  toolCallId?: string;
  mcpToolCallId?: string;
  argumentSummary?: string;
  resultSummary?: string;
  durationMs?: number;
  isError?: boolean;
}
