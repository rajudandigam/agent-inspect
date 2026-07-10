import readline from "node:readline";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  READ_ONLY_TOOLS,
  callReadOnlyTool,
  createMcpServerContext,
  type McpServerContext,
} from "./tools.js";

const packageVersion = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8",
  ),
).version as string;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
};

export interface RunReadOnlyMcpServerOptions {
  traceDir?: string;
  maxEvents?: number;
  redactionProfile?: "local" | "share" | "strict";
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export async function runReadOnlyMcpServer(
  options: RunReadOnlyMcpServerOptions = {},
): Promise<void> {
  const context: McpServerContext = createMcpServerContext(options);
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  const write = (line: string) => {
    output.write(`${line}\n`);
  };

  const replyError = (
    id: number | string | null | undefined,
    code: number,
    message: string,
  ) => {
    write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code, message },
      }),
    );
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let request: JsonRpcRequest;
    try {
      request = JSON.parse(line) as JsonRpcRequest;
    } catch {
      write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        }),
      );
      continue;
    }

    const { id, method, params } = request;
    try {
      if (method === "initialize") {
        write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              serverInfo: { name: "@agent-inspect/mcp-server", version: packageVersion },
              capabilities: { tools: {} },
            },
          }),
        );
        continue;
      }
      if (method === "notifications/initialized") {
        continue;
      }
      if (method === "tools/list") {
        write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: { tools: READ_ONLY_TOOLS },
          }),
        );
        continue;
      }
      if (method === "tools/call") {
        const toolParams = (params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
        const result = await callReadOnlyTool(
          context,
          String(toolParams.name ?? ""),
          toolParams.arguments ?? {},
        );
        write(JSON.stringify({ jsonrpc: "2.0", id, result }));
        continue;
      }
      replyError(id, -32601, `Method not found: ${method}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      replyError(id, -32000, message);
    }
  }
}

export { READ_ONLY_TOOLS, callReadOnlyTool, createMcpServerContext } from "./tools.js";
