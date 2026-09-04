/**
 * TraceFacts three-surface parity across a schema corpus.
 *
 * Extends the single-fixture parity from #229 to schema 0.1, 0.2, and a 1.0
 * trace: the TypeScript API TraceFacts summary is the source of truth, and CLI
 * evidence `semantics` and the read-only MCP `get_trace_facts` tool must report
 * the same semantic fields for each. The MCP read must not mutate the trace
 * directory. Synthetic local fixtures only; MCP stays read-only and
 * path-contained.
 */
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTraceFacts } from "agent-inspect/checks";
import { openTraceFile } from "agent-inspect/readers";

import { artifactsCommand } from "../../cli/src/artifacts.js";
import { callReadOnlyTool, createMcpServerContext } from "../src/tools.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// One representative trace per persisted schema, each with a finished tool so
// the parity fields are non-trivial.
const corpus = [
  { schema: "0.1", file: "fixtures/traces/tool-with-io.jsonl" },
  { schema: "0.2", file: "fixtures/traces-v0.2/adapter-langchain-like.jsonl" },
  { schema: "1.0", file: "fixtures/traces-v1.0/manual-basic.jsonl" },
] as const;

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

describe("TraceFacts public-surface parity corpus", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  for (const { schema, file } of corpus) {
    it(`agrees across API, CLI evidence, and MCP for schema ${schema}`, async () => {
      const fixture = path.join(repoRoot, file);
      const tempRoot = await mkdtemp(
        path.join(os.tmpdir(), `agent-inspect-trace-facts-parity-${schema}-`),
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
      // The corpus fixtures each finish at least one tool.
      expect(expected.finishedToolCount).toBeGreaterThan(0);

      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});

      // CLI surface: evidence.json semantics.
      await artifactsCommand(fixture, { outputDir, alwaysEvidence: true, json: true });
      expect(process.exitCode ?? 0).toBe(0);
      const evidence = JSON.parse(
        await readFile(path.join(outputDir, "evidence.json"), "utf8"),
      ) as { semantics?: ParitySummary };
      expect(evidence.semantics).toBeDefined();
      expect(
        paritySummary(evidence.semantics!),
        `CLI TraceFacts differ from the API on schema ${schema}`,
      ).toEqual(expected);

      // MCP surface: read-only get_trace_facts, and no mutation of the trace dir.
      const beforeRead = await readdir(traceDir);
      const beforeBytes = await readFile(path.join(traceDir, "parity.jsonl"));
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
      expect(
        paritySummary(mcp.summary),
        `MCP TraceFacts differ from the API on schema ${schema}`,
      ).toEqual(expected);
      expect(mcp.toolNames).toEqual([...apiFacts.toolsByName.keys()].sort());
      expect(mcp.llmCount).toBe(apiFacts.llmEvents.length);
      expect(mcp.outcomeCount).toBe(apiFacts.outcomeEvents.length);

      expect(await readdir(traceDir)).toEqual(beforeRead);
      expect(await readFile(path.join(traceDir, "parity.jsonl"))).toEqual(beforeBytes);
    });
  }
});
