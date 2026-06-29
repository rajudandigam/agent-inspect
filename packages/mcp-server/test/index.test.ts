import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable, Writable } from "node:stream";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun } from "agent-inspect";

import { READ_ONLY_TOOLS, callReadOnlyTool, createMcpServerContext } from "../src/tools.js";
import { runReadOnlyMcpServer } from "../src/index.js";

describe("@agent-inspect/mcp-server", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-mcp-server-"));
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    await inspectRun("mcp-server-run", async () => {}, { traceDir });
  });

  afterEach(async () => {
    delete process.env.AGENT_INSPECT_TRACE_DIR;
    await rm(traceDir, { recursive: true, force: true });
  });

  it("exposes read-only tool catalog", () => {
    expect(READ_ONLY_TOOLS).toHaveLength(8);
    expect(READ_ONLY_TOOLS.map((tool) => tool.name)).toEqual([
      "list_traces",
      "read_trace",
      "search_traces",
      "find_first_error",
      "find_slowest_path",
      "compare_runs",
      "run_checks",
      "create_share_safe_report",
    ]);
  });

  it("defaults redaction profile to share", () => {
    const context = createMcpServerContext({ traceDir });
    expect(context.redactionProfile).toBe("share");
  });

  it("lists traces via tool handler", async () => {
    const context = createMcpServerContext({ traceDir });
    const result = await callReadOnlyTool(context, "list_traces", {});
    expect(result.isError).toBe(false);
    const payload = JSON.parse(result.content[0]!.text as string) as Array<{ runId: string }>;
    expect(payload.length).toBeGreaterThan(0);
  });

  it("handles tools/list over stdio", async () => {
    const input = Readable.from([
      `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`,
    ]);
    const chunks: string[] = [];
    const output = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(String(chunk));
        callback();
      },
    });
    const done = runReadOnlyMcpServer({ traceDir, input, output });
    await done;
    const response = JSON.parse(chunks[0]!);
    expect(response.result.tools.length).toBeGreaterThan(0);
  });
});
