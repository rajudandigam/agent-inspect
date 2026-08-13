import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTraceFacts } from "agent-inspect/checks";
import { openTraceFile } from "agent-inspect/readers";

import { artifactsCommand } from "../../cli/src/artifacts.js";
import { callReadOnlyTool, createMcpServerContext } from "../src/tools.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.resolve(
  testDir,
  "../../../fixtures/langgraph/pilot-shaped-bridged-tool.jsonl",
);

type ParitySummary = {
  rawEventCount: number;
  logicalEventCount: number;
  runningLogicalCount: number;
  finishedToolNames: readonly string[];
  finishedToolCount: number;
  pairedCount: number;
  parentRemapCount: number;
};

function paritySummary(value: ParitySummary): ParitySummary {
  return {
    rawEventCount: value.rawEventCount,
    logicalEventCount: value.logicalEventCount,
    runningLogicalCount: value.runningLogicalCount,
    finishedToolNames: [...value.finishedToolNames],
    finishedToolCount: value.finishedToolCount,
    pairedCount: value.pairedCount,
    parentRemapCount: value.parentRemapCount,
  };
}

function expectSurfaceParity(
  surface: "CLI" | "MCP",
  actual: ParitySummary,
  expected: ParitySummary,
): void {
  expect(
    paritySummary(actual),
    `${surface} TraceFacts semantic fields differ from the TypeScript API`,
  ).toEqual(expected);
}

describe("TraceFacts public-surface parity", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("agrees across TypeScript API, CLI evidence, and read-only MCP", async () => {
    const tempRoot = await mkdtemp(
      path.join(os.tmpdir(), "agent-inspect-trace-facts-parity-"),
    );
    tempDirs.push(tempRoot);
    const traceDir = path.join(tempRoot, "traces");
    const outputDir = path.join(tempRoot, "artifacts");
    await mkdir(traceDir, { recursive: true });
    const fixtureBytes = await readFile(fixture);
    await writeFile(path.join(traceDir, "parity.jsonl"), fixtureBytes);

    const read = await openTraceFile(fixture);
    const apiFacts = buildTraceFacts(read);
    const expected = paritySummary(apiFacts.summary);

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    await artifactsCommand(fixture, {
      outputDir,
      alwaysEvidence: true,
      json: true,
    });
    expect(process.exitCode ?? 0).toBe(0);
    const evidence = JSON.parse(
      await readFile(path.join(outputDir, "evidence.json"), "utf8"),
    ) as { semantics?: ParitySummary };
    expect(evidence.semantics).toBeDefined();
    expectSurfaceParity("CLI", evidence.semantics!, expected);

    const beforeMcpRead = await readdir(traceDir);
    const beforeMcpBytes = await readFile(path.join(traceDir, "parity.jsonl"));
    const mcpResult = await callReadOnlyTool(
      createMcpServerContext({ traceDir }),
      "get_trace_facts",
      { runId: read.runs[0]!.runId },
    );
    expect(mcpResult.isError).toBe(false);
    const mcp = JSON.parse(mcpResult.content[0]!.text as string) as {
      summary: ParitySummary;
      toolNames: string[];
      llmCount: number;
      outcomeCount: number;
    };
    expectSurfaceParity("MCP", mcp.summary, expected);
    expect(mcp.toolNames).toEqual([...apiFacts.toolsByName.keys()].sort());
    expect(mcp.llmCount).toBe(apiFacts.llmEvents.length);
    expect(mcp.outcomeCount).toBe(apiFacts.outcomeEvents.length);
    expect(await readdir(traceDir)).toEqual(beforeMcpRead);
    expect(await readFile(path.join(traceDir, "parity.jsonl"))).toEqual(
      beforeMcpBytes,
    );
  });
});
