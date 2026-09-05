import readline from "node:readline";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  handleMcpProtocolLine,
  type ProtocolSession,
} from "./protocol.js";
import { createMcpServerContext, type McpServerContext } from "./tools.js";

const packageVersion = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8",
  ),
).version as string;

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

  const session: ProtocolSession = {
    context,
    serverName: "@agent-inspect/mcp-server",
    serverVersion: packageVersion,
    write: (line: string) => {
      output.write(`${line}\n`);
    },
    inflight: new Map(),
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    await handleMcpProtocolLine(session, line);
  }
}

export {
  MCP_MAX_REQUEST_BYTES,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_INSTRUCTIONS,
  handleMcpProtocolLine,
} from "./protocol.js";
export {
  READ_ONLY_TOOLS,
  TRACE_DATA_UNTRUSTED_WARNING,
  callReadOnlyTool,
  createMcpServerContext,
} from "./tools.js";
