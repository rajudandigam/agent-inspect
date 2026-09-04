/**
 * MCP protocol-state corpus.
 *
 * Drives the read-only MCP protocol handler through a synthetic corpus of
 * protocol states (initialize, notifications, ping, tools/list, tools/call, and
 * malformed / unknown requests) and asserts each response shape. No network and
 * no writes; the handler runs against a path-contained read-only context.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { handleMcpProtocolLine, type ProtocolSession } from "../src/protocol.js";
import { READ_ONLY_TOOLS, createMcpServerContext } from "../src/tools.js";

interface ProtocolCase {
  name: string;
  request?: unknown;
  rawLine?: string;
  expect: {
    kind: "result" | "error" | "none";
    code?: number;
    resultEquals?: unknown;
    resultContains?: Record<string, unknown>;
    resultIsError?: boolean;
    toolsNonEmpty?: boolean;
  };
}

const corpusPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/mcp/protocol-states.v1.json",
);
const corpus = JSON.parse(readFileSync(corpusPath, "utf8")) as {
  cases: ProtocolCase[];
};

function session(lines: string[]): ProtocolSession {
  return {
    context: createMcpServerContext({ traceDir: "." }),
    serverName: "@agent-inspect/mcp-server",
    serverVersion: "0.0.0-test",
    write: (line) => lines.push(line),
    inflight: new Map(),
  };
}

describe("MCP protocol-state corpus", () => {
  it("has cases", () => {
    expect(corpus.cases.length).toBeGreaterThan(0);
  });

  for (const testCase of corpus.cases) {
    it(testCase.name, async () => {
      const line =
        testCase.rawLine !== undefined ? testCase.rawLine : JSON.stringify(testCase.request);
      const out: string[] = [];
      await handleMcpProtocolLine(session(out), line);

      if (testCase.expect.kind === "none") {
        expect(out).toHaveLength(0);
        return;
      }

      expect(out).toHaveLength(1);
      const body = JSON.parse(out[0]!) as {
        result?: Record<string, unknown>;
        error?: { code: number };
      };

      if (testCase.expect.kind === "error") {
        expect(body.error?.code).toBe(testCase.expect.code);
        return;
      }

      // result
      expect(body.result).toBeDefined();
      if (testCase.expect.resultEquals !== undefined) {
        expect(body.result).toEqual(testCase.expect.resultEquals);
      }
      if (testCase.expect.resultContains !== undefined) {
        expect(body.result).toMatchObject(testCase.expect.resultContains);
      }
      if (testCase.expect.resultIsError !== undefined) {
        expect(body.result?.isError).toBe(testCase.expect.resultIsError);
      }
      if (testCase.expect.toolsNonEmpty) {
        expect(Array.isArray(body.result?.tools)).toBe(true);
        expect((body.result?.tools as unknown[]).length).toBe(READ_ONLY_TOOLS.length);
      }
    });
  }
});
