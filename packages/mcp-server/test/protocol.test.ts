import { describe, expect, it } from "vitest";

import {
  MCP_MAX_REQUEST_BYTES,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_INSTRUCTIONS,
  handleMcpProtocolLine,
  type ProtocolSession,
} from "../src/protocol.js";
import { createMcpServerContext } from "../src/tools.js";

function sessionWithCapture(lines: string[]): ProtocolSession {
  return {
    context: createMcpServerContext({ traceDir: "." }),
    serverName: "@agent-inspect/mcp-server",
    serverVersion: "0.0.0-test",
    write: (line) => {
      lines.push(line);
    },
    inflight: new Map(),
  };
}

describe("mcp protocol hardening", () => {
  it("negotiates initialize with protocol version", async () => {
    const out: string[] = [];
    const session = sessionWithCapture(out);
    await handleMcpProtocolLine(
      session,
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      }),
    );
    const body = JSON.parse(out[0]!);
    expect(body.result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
    expect(body.result.capabilities.tools).toEqual({ listChanged: false });
    expect(body.result.instructions).toBe(MCP_SERVER_INSTRUCTIONS);
  });

  it("answers ping", async () => {
    const out: string[] = [];
    await handleMcpProtocolLine(
      sessionWithCapture(out),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }),
    );
    expect(JSON.parse(out[0]!).result).toEqual({});
  });

  it("rejects oversized frames", async () => {
    const out: string[] = [];
    const huge = "x".repeat(MCP_MAX_REQUEST_BYTES + 10);
    await handleMcpProtocolLine(sessionWithCapture(out), huge);
    const body = JSON.parse(out[0]!);
    expect(body.error.code).toBe(-32600);
  });

  it("returns parse error for malformed JSON", async () => {
    const out: string[] = [];
    await handleMcpProtocolLine(sessionWithCapture(out), "{not-json");
    expect(JSON.parse(out[0]!).error.code).toBe(-32700);
  });

  it("cancels in-flight tool calls via notifications/cancelled", async () => {
    const out: string[] = [];
    const session = sessionWithCapture(out);
    const ac = new AbortController();
    session.inflight.set("9", ac);

    await handleMcpProtocolLine(
      session,
      JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/cancelled",
        params: { requestId: 9 },
      }),
    );
    expect(ac.signal.aborted).toBe(true);
    expect(out).toHaveLength(0);
  });
});
