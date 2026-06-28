import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun } from "agent-inspect";

import { resetMcpToolCallIdsForTests, wrapMcpClient } from "../src/index.js";

describe("@agent-inspect/mcp", () => {
  let traceDir: string;

  beforeEach(async () => {
    resetMcpToolCallIdsForTests();
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-mcp-"));
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
  });

  afterEach(async () => {
    delete process.env.AGENT_INSPECT_TRACE_DIR;
    await rm(traceDir, { recursive: true, force: true });
  });

  it("records tools/list and tools/call as tool steps with mcp metadata", async () => {
    const client = wrapMcpClient(
      {
        async listTools() {
          return { tools: [{ name: "echo" }] };
        },
        async callTool({ name, arguments: args }) {
          return { content: [{ type: "text", text: `ok:${name}:${JSON.stringify(args)}` }] };
        },
      },
      {
        serverName: "fixture-server",
        serverUrl: "http://127.0.0.1:7337",
        sessionId: "sess-mcp-001",
      },
    );

    await inspectRun("mcp-run", async () => {
      await client.listTools?.();
      await client.callTool({ name: "echo", arguments: { message: "hi" } });
    }, { traceDir });

    const traceFiles = await readdir(traceDir);
    const traceFile = traceFiles.find((file) => file.endsWith(".jsonl"));
    expect(traceFile).toBeDefined();
    const files = await readFile(path.join(traceDir, traceFile!), "utf-8");
    expect(files).toContain("mcp:tools/list");
    expect(files).toContain("mcp:echo");
    expect(files).toContain("\"type\":\"mcp-client\"");
    expect(files).toContain("fixture-server");
    expect(files).toContain("sess-mcp-001");
    expect(files).toContain("echo");
  });

  it("truncates large argument summaries", async () => {
    const { summarizeMcpValue } = await import("../src/summarize.js");
    const summary = summarizeMcpValue({ payload: "x".repeat(500) }, 40);
    expect(summary.endsWith("...")).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(40);
  });
});
