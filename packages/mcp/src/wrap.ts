import { step } from "agent-inspect";

import { hashServerUrl, summarizeMcpValue } from "./summarize.js";
import type {
  McpClientLike,
  McpClientTracerOptions,
  McpTraceMetadata,
} from "./types.js";

let toolCallCounter = 0;

function nextToolCallId(prefix?: string): string {
  toolCallCounter += 1;
  const base = prefix?.trim() || "mcp";
  return `${base}-${toolCallCounter}`;
}

function baseMetadata(
  options: McpClientTracerOptions,
  overrides: Partial<McpTraceMetadata> = {},
): Record<string, unknown> {
  const metadata: McpTraceMetadata = {
    source: { type: "mcp-client" },
    ...(options.serverName ? { mcpServerName: options.serverName } : {}),
    ...(options.serverUrl
      ? { mcpServerUrlHash: hashServerUrl(options.serverUrl) }
      : {}),
    ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    ...overrides,
  };
  return { ...(options.metadata ?? {}), ...metadata };
}

/**
 * Wraps an MCP client so tools/list and tools/call emit local tool steps.
 * Telemetry only — does not proxy network behavior beyond the wrapped client.
 */
export function wrapMcpClient<T extends McpClientLike>(
  client: T,
  options: McpClientTracerOptions = {},
): T {
  const maxSummaryLength = options.maxSummaryLength ?? 240;
  const wrapped = { ...client } as T;

  if (typeof client.listTools === "function") {
    const listTools = client.listTools.bind(client);
    wrapped.listTools = async (params?: unknown) =>
      step(
        "mcp:tools/list",
        async () => {
          const result = await listTools(params);
          return result;
        },
        {
          type: "tool",
          metadata: baseMetadata(options, {
            toolName: "tools/list",
            toolCallId: nextToolCallId(options.toolCallIdPrefix),
          }),
        },
      );
  }

  const callTool = client.callTool.bind(client);
  wrapped.callTool = async (params) =>
    step(
      `mcp:${params.name}`,
      async () => callTool(params),
      {
        type: "tool",
        metadata: baseMetadata(options, {
          toolName: params.name,
          toolCallId: nextToolCallId(options.toolCallIdPrefix),
          argumentSummary: summarizeMcpValue(
            params.arguments ?? {},
            maxSummaryLength,
          ),
        }),
      },
    );

  return wrapped;
}

/** @internal resets tool call ids for deterministic tests */
export function resetMcpToolCallIdsForTests(): void {
  toolCallCounter = 0;
}
