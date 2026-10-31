import { observeOutcome, step } from "agent-inspect";

import { hashServerUrl, summarizeMcpValue } from "./summarize.js";
import type {
  McpClientLike,
  McpClientTracerOptions,
  McpRequestOptions,
  McpTraceMetadata,
} from "./types.js";

let toolCallCounter = 0;

function resultReportsToolError(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.isError === true) return true;
  const nested = record.toolResult;
  if (!nested || typeof nested !== "object") return false;
  return (nested as Record<string, unknown>).isError === true;
}

function boundedId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > 200) return undefined;
  return trimmed;
}

async function recordToolResultOutcome(
  toolName: string,
  toolCallId: string,
  result: unknown,
  callMetadata: Record<string, unknown>,
): Promise<void> {
  if (!resultReportsToolError(result)) return;
  const operationId = boundedId(callMetadata.operationId);
  const attemptId = boundedId(callMetadata.attemptId);
  await observeOutcome(`mcp:${toolName}:tool-result`, {
    expectation: "MCP tool result is not an error",
    status: "failed",
    method: "custom",
    evidence: {
      toolFailure: true,
      toolName,
      toolCallId,
      ...(operationId !== undefined ? { operationId } : {}),
      ...(attemptId !== undefined ? { attemptId } : {}),
    },
  });
}

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

/** SDK RequestOptions keys — must never be swallowed as AgentInspect metadata. */
const SDK_REQUEST_OPTION_KEYS = [
  "signal",
  "timeout",
  "onprogress",
  "resetTimeoutOnProgress",
  "maxTotalTimeout",
  "relatedRequestId",
  "resumptionToken",
  "onresumptiontoken",
] as const;

function isSdkRequestOptions(value: unknown): value is McpRequestOptions {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return SDK_REQUEST_OPTION_KEYS.some((key) => key in obj);
}

/**
 * AgentInspect per-call metadata bag: `{ metadata: {...} }` without SDK option keys.
 * Must not consume ordinary SDK RequestOptions that happen to be objects.
 */
function isAgentInspectMetadataBag(
  value: unknown,
): value is { metadata?: Record<string, unknown> } {
  if (!value || typeof value !== "object") return false;
  if (isSdkRequestOptions(value)) return false;
  const obj = value as Record<string, unknown>;
  if (!("metadata" in obj)) return false;
  // Zod/result schemas expose parse — never treat those as AI bags.
  if ("parse" in obj) return false;
  return true;
}

function extractCallMetadata(bag: {
  metadata?: Record<string, unknown>;
}): Record<string, unknown> {
  if (bag.metadata && typeof bag.metadata === "object") {
    return bag.metadata;
  }
  return {};
}

/** Peel AgentInspect `metadata` without consuming SDK RequestOptions keys. */
function peelOptionsObject(value: unknown): {
  callMetadata: Record<string, unknown>;
  requestOptions: McpRequestOptions | undefined;
} {
  if (value === null || value === undefined) {
    return { callMetadata: {}, requestOptions: undefined };
  }
  if (typeof value !== "object") {
    return { callMetadata: {}, requestOptions: undefined };
  }
  const obj = value as Record<string, unknown>;
  const callMetadata = extractCallMetadata(obj);

  // Pure AI bag — do not forward as SDK RequestOptions.
  if (isAgentInspectMetadataBag(value)) {
    return { callMetadata, requestOptions: undefined };
  }

  if (isSdkRequestOptions(value) || Object.keys(obj).length > 0) {
    const { metadata: _ignored, ...rest } = obj;
    return {
      callMetadata,
      requestOptions: rest as McpRequestOptions,
    };
  }

  return { callMetadata, requestOptions: undefined };
}

/**
 * Resolve SDK callTool arity:
 *   callTool(params, resultSchema?, requestOptions?)
 * plus AgentInspect overloads that peel `{ metadata }` without dropping RequestOptions.
 * Composed `{ timeout, metadata: { operationId, attemptId } }` keeps both sides.
 */
export function resolveCallToolArgs(
  resultSchemaOrOptions?: unknown,
  maybeOptions?: unknown,
): {
  resultSchema: unknown;
  requestOptions: McpRequestOptions | undefined;
  callMetadata: Record<string, unknown>;
} {
  // Three-arg form: (params, schema|undefined, options)
  if (maybeOptions !== undefined) {
    const peeled = peelOptionsObject(maybeOptions);
    return {
      resultSchema: resultSchemaOrOptions,
      requestOptions: peeled.requestOptions,
      callMetadata: peeled.callMetadata,
    };
  }

  // Two-arg form: (params, schema) OR (params, { metadata }) OR (params, RequestOptions)
  if (isAgentInspectMetadataBag(resultSchemaOrOptions)) {
    return {
      resultSchema: undefined,
      requestOptions: undefined,
      callMetadata: extractCallMetadata(resultSchemaOrOptions),
    };
  }

  if (isSdkRequestOptions(resultSchemaOrOptions)) {
    const peeled = peelOptionsObject(resultSchemaOrOptions);
    return {
      resultSchema: undefined,
      requestOptions: peeled.requestOptions,
      callMetadata: peeled.callMetadata,
    };
  }

  return {
    resultSchema: resultSchemaOrOptions,
    requestOptions: undefined,
    callMetadata: {},
  };
}

function invokeCallTool(
  callToolImpl: McpClientLike["callTool"],
  params: Parameters<McpClientLike["callTool"]>[0],
  resultSchema: unknown,
  requestOptions: McpRequestOptions | undefined,
): Promise<unknown> {
  const fn = callToolImpl as (
    p: unknown,
    schema?: unknown,
    opts?: unknown,
  ) => Promise<unknown>;
  if (requestOptions !== undefined) {
    return fn(params, resultSchema, requestOptions);
  }
  if (resultSchema !== undefined) {
    return fn(params, resultSchema);
  }
  return fn(params);
}

/**
 * Wraps an MCP client so tools/list and tools/call emit local tool steps.
 * Telemetry only — does not proxy network behavior beyond the wrapped client.
 *
 * Uses a Proxy over the original client so prototype methods (`connect`,
 * `close`, `listResources`, …), private SDK state, and `instanceof` stay intact.
 * A shallow object spread would drop prototype methods and copy private fields.
 *
 * Forwards the real SDK argument positions, including `RequestOptions`
 * (`signal`, `timeout`, progress callbacks). Does not fake cancellation while
 * still dispatching the underlying request.
 */
export function wrapMcpClient<T extends McpClientLike>(
  client: T,
  options: McpClientTracerOptions = {},
): T {
  const maxSummaryLength = options.maxSummaryLength ?? 240;

  const listToolsImpl =
    typeof client.listTools === "function"
      ? client.listTools.bind(client)
      : undefined;
  const callToolImpl = client.callTool.bind(client);

  const wrappedListTools = listToolsImpl
    ? async (params?: unknown, requestOptions?: McpRequestOptions) =>
        step(
          "mcp:tools/list",
          async () => {
            if (requestOptions !== undefined) {
              return (
                listToolsImpl as (
                  p?: unknown,
                  opts?: unknown,
                ) => Promise<unknown>
              )(params, requestOptions);
            }
            return listToolsImpl(params);
          },
          {
            type: "tool",
            metadata: baseMetadata(options, {
              toolName: "tools/list",
              toolCallId: nextToolCallId(options.toolCallIdPrefix),
            }),
          },
        )
    : undefined;

  const wrappedCallTool = async (
    params: Parameters<McpClientLike["callTool"]>[0],
    resultSchemaOrOptions?: unknown,
    maybeOptions?: unknown,
  ) => {
    const { resultSchema, requestOptions, callMetadata } = resolveCallToolArgs(
      resultSchemaOrOptions,
      maybeOptions,
    );

    const toolCallId = nextToolCallId(options.toolCallIdPrefix);
    return step(
      `mcp:${params.name}`,
      async () => {
        const result = await invokeCallTool(
          callToolImpl,
          params,
          resultSchema,
          requestOptions,
        );
        await recordToolResultOutcome(
          params.name,
          toolCallId,
          result,
          callMetadata,
        );
        return result;
      },
      {
        type: "tool",
        metadata: baseMetadata(options, {
          toolName: params.name,
          toolCallId,
          argumentSummary: summarizeMcpValue(
            params.arguments ?? {},
            maxSummaryLength,
          ),
          ...callMetadata,
        }),
      },
    );
  };

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "listTools" && wrappedListTools !== undefined) {
        return wrappedListTools;
      }
      if (property === "callTool") {
        return wrappedCallTool;
      }
      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
  }) as T;
}

/** @internal resets tool call ids for deterministic tests */
export function resetMcpToolCallIdsForTests(): void {
  toolCallCounter = 0;
}
