import { chmod, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun } from "agent-inspect";

import { resetMcpToolCallIdsForTests, wrapMcpClient } from "../src/index.js";
import type { McpClientLike } from "../src/types.js";

type TraceRow = {
  event?: string;
  name?: string;
  status?: string;
  runId?: string;
  stepId?: string;
  parentId?: string;
  error?: { message?: string };
  evidence?: { toolFailure?: boolean; toolName?: string; operationId?: string; attemptId?: string };
  metadata?: { operationId?: string; attemptId?: string; toolCallId?: string };
};

async function readRows(traceDir: string): Promise<TraceRow[]> {
  const files = (await readdir(traceDir)).filter((file) => file.endsWith(".jsonl"));
  expect(files.length).toBeGreaterThan(0);
  const chunks = await Promise.all(
    files.map((file) => readFile(path.join(traceDir, file), "utf-8")),
  );
  return chunks
    .join("\n")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as TraceRow);
}

describe("MCP tool result failures", () => {
  let traceDir: string;

  beforeEach(async () => {
    resetMcpToolCallIdsForTests();
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-mcp-tool-error-"));
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  it("keeps a successful tool result and does not record a tool failure", async () => {
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        return { content: [{ type: "text", text: "ok" }], isError: false };
      },
    });
    const result = await inspectRun(
      "mcp-ok",
      async () => client.callTool({ name: "echo", arguments: { q: "ok" } }),
      { traceDir, silent: true },
    );
    expect(result).toEqual({ content: [{ type: "text", text: "ok" }], isError: false });
    const rows = await readRows(traceDir);
    const started = rows.find((row) => row.event === "step_started");
    expect(started?.name).toBe("mcp:echo");
    const completed = rows.filter((row) => row.event === "step_completed");
    expect(completed.some((row) => row.status === "success")).toBe(true);
    expect(rows.some((row) => row.event === "outcome_observed")).toBe(false);
  });

  it("returns isError results and records a failed tool outcome", async () => {
    let calls = 0;
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        calls += 1;
        return { content: [{ type: "text", text: "nope" }], isError: true };
      },
    });
    const result = await inspectRun(
      "mcp-is-error",
      async () =>
        client.callTool(
          { name: "lookup", arguments: {} },
          undefined,
          { metadata: { operationId: "op-1", attemptId: "1" } },
        ),
      { traceDir, silent: true },
    );
    expect(calls).toBe(1);
    expect(result).toEqual({ content: [{ type: "text", text: "nope" }], isError: true });
    const rows = await readRows(traceDir);
    const toolStep = rows.find((row) => row.event === "step_started" && row.name === "mcp:lookup");
    const completed = rows.find(
      (row) => row.event === "step_completed" && row.stepId === toolStep?.stepId,
    );
    expect(completed?.status).toBe("success");
    const outcome = rows.find((row) => row.event === "outcome_observed");
    expect(outcome?.status).toBe("failed");
    expect(outcome?.parentId).toBe(toolStep?.stepId);
    expect(outcome?.evidence).toMatchObject({
      toolFailure: true,
      toolName: "lookup",
      operationId: "op-1",
      attemptId: "1",
    });
    expect(JSON.stringify(rows)).not.toContain("nope");
  });

  it("preserves a thrown RPC error and does not invent a tool-result outcome", async () => {
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        throw new Error("rpc down");
      },
    });
    await expect(
      inspectRun("mcp-throw", async () => client.callTool({ name: "lookup", arguments: {} }), {
        traceDir,
        silent: true,
      }),
    ).rejects.toThrow("rpc down");
    const rows = await readRows(traceDir);
    const completed = rows.find((row) => row.event === "step_completed");
    expect(completed?.status).toBe("error");
    expect(completed?.error?.message).toContain("rpc down");
    expect(rows.some((row) => row.event === "outcome_observed")).toBe(false);
  });

  it("keeps the failed attempt when a later retry succeeds", async () => {
    let calls = 0;
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        calls += 1;
        if (calls === 1) return { isError: true, content: [] };
        return { isError: false, content: [{ type: "text", text: "recovered" }] };
      },
    });
    const result = await inspectRun(
      "mcp-retry",
      async () => {
        const first = await client.callTool({ name: "lookup", arguments: {} }, undefined, {
          metadata: { operationId: "op-1", attemptId: "1" },
        });
        const second = await client.callTool({ name: "lookup", arguments: {} }, undefined, {
          metadata: { operationId: "op-1", attemptId: "2" },
        });
        return { first, second };
      },
      { traceDir, silent: true },
    );
    expect(calls).toBe(2);
    expect(result.second).toMatchObject({ isError: false });
    const rows = await readRows(traceDir);
    const failures = rows.filter(
      (row) => row.event === "outcome_observed" && row.status === "failed",
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]?.evidence?.attemptId).toBe("1");
    const toolSteps = rows.filter((row) => row.event === "step_started" && row.name === "mcp:lookup");
    expect(toolSteps).toHaveLength(2);
  });

  it("does not throw when the caller handles isError", async () => {
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        return { isError: true, content: [{ type: "text", text: "missing" }] };
      },
    });
    const answer = await inspectRun(
      "mcp-handled",
      async () => {
        const result = (await client.callTool({ name: "lookup", arguments: {} })) as {
          isError?: boolean;
        };
        return result.isError === true ? "fallback-answer" : "tool-answer";
      },
      { traceDir, silent: true },
    );
    expect(answer).toBe("fallback-answer");
    const rows = await readRows(traceDir);
    expect(rows.find((row) => row.event === "run_completed")?.status).toBe("success");
    expect(rows.some((row) => row.event === "outcome_observed" && row.status === "failed")).toBe(
      true,
    );
  });

  it("does not leak tool outcomes across parallel runs", async () => {
    const client = wrapMcpClient<McpClientLike>({
      async callTool(params) {
        return { isError: params.name === "bad", content: [] };
      },
    });
    await Promise.all([
      inspectRun(
        "run-a",
        async () => client.callTool({ name: "bad", arguments: {} }, undefined, {
          metadata: { operationId: "op-a", attemptId: "1" },
        }),
        { traceDir, silent: true },
      ),
      inspectRun(
        "run-b",
        async () => client.callTool({ name: "good", arguments: {} }, undefined, {
          metadata: { operationId: "op-b", attemptId: "1" },
        }),
        { traceDir, silent: true },
      ),
    ]);
    const rows = await readRows(traceDir);
    const failures = rows.filter((row) => row.event === "outcome_observed");
    expect(failures).toHaveLength(1);
    expect(failures[0]?.evidence?.operationId).toBe("op-a");
    const runs = new Set(rows.map((row) => row.runId));
    expect(runs.size).toBe(2);
    expect(failures[0]?.runId).not.toBe(
      rows.find((row) => row.event === "step_started" && row.name === "mcp:good")?.runId,
    );
  });

  it("returns the SDK result when outcome persistence fails", async () => {
    const client = wrapMcpClient<McpClientLike>({
      async callTool() {
        return { content: [{ type: "text", text: "kept" }], isError: true };
      },
    });
    const result = await inspectRun(
      "mcp-disk",
      async () => {
        const files = (await readdir(traceDir)).filter((file) => file.endsWith(".jsonl"));
        expect(files.length).toBeGreaterThan(0);
        await Promise.all(files.map((file) => chmod(path.join(traceDir, file), 0o444)));
        return client.callTool({ name: "lookup", arguments: {} });
      },
      { traceDir, silent: true },
    );
    expect(result).toEqual({ content: [{ type: "text", text: "kept" }], isError: true });
  });
});
