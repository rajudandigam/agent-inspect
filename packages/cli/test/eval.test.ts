import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evalCommand } from "../src/eval.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasEvalCommand =
  existsSync(cliDist) && readFileSync(cliDist, "utf-8").includes("Run deterministic local evals");

function jsonl(...rows: unknown[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

function event(
  eventId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-eval-cli",
    kind: "RUN",
    name: "eval-cli",
    status: "ok",
    timestamp: "2026-06-27T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

async function writeTrace(dir: string, name: string, rows: unknown[]): Promise<string> {
  const file = path.join(dir, name);
  await writeFile(file, jsonl(...rows), "utf-8");
  return file;
}

async function runEval(target: string, options: Parameters<typeof evalCommand>[1] = {}) {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  await evalCommand(target, { json: true, ...options });
  const output = String(logSpy.mock.calls[0]?.[0] ?? "{}");
  logSpy.mockRestore();
  return JSON.parse(output) as {
    status?: string;
    diagnostics?: { code?: string; message?: string }[];
    findings?: { ruleId?: string; message?: string }[];
  };
}

describe("eval command", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-eval-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await rm(tmp, { recursive: true, force: true });
  });

  it("prints deterministic JSON for a successful local eval without network calls", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const file = await writeTrace(tmp, "ok.jsonl", [
      event("event-retrieval", {
        kind: "RETRIEVER",
        name: "retrieveDocs",
        attributes: {
          documents: [{ id: "doc-cli", text: "local evals stay deterministic" }],
          sourceIds: ["doc-cli"],
        },
      }),
      event("event-llm", {
        kind: "LLM",
        name: "generateAnswer",
        attributes: {
          answer: "AgentInspect evals stay deterministic [doc-cli].",
          citations: ["doc-cli"],
        },
      }),
    ]);

    const result = await runEval(file, {
      requireSuccess: true,
      requiredSourceId: ["doc-cli"],
      citationPresence: true,
      contextOverlap: true,
    });

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns exit code 1 for failed evals and supports Markdown output", async () => {
    const file = await writeTrace(tmp, "fail.jsonl", [
      event("event-tool", { kind: "TOOL", name: "deleteAccount" }),
    ]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await evalCommand(file, { markdown: true, forbidTool: ["deleteAccount"] });
    const output = String(logSpy.mock.calls[0]?.[0] ?? "");
    logSpy.mockRestore();

    expect(process.exitCode).toBe(1);
    expect(output).toContain("Status: fail");
    expect(output).toContain("eval.forbiddenTools");
  });

  it("supports run-id lookup, explicit format, and JSON config", async () => {
    await writeTrace(tmp, "run-eval-cli.jsonl", [
      event("event-tool", { kind: "TOOL", name: "searchDocs" }),
    ]);
    const config = path.join(tmp, "agent-inspect.eval.json");
    await writeFile(
      config,
      JSON.stringify({
        eval: {
          requireSuccess: true,
          requiredTools: ["searchDocs"],
          forbiddenTools: ["deleteAccount"],
        },
      }),
      "utf-8",
    );

    const result = await runEval("run-eval-cli", {
      dir: tmp,
      config,
      format: "agent-inspect-jsonl",
      run: "run-eval-cli",
    });

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
  });

  it("maps failed checks, invalid arguments, unsupported TypeScript configs, and unreadable input", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [event("event-a")]);

    let result = await runEval(file, { maxDurationMs: "nope" });
    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_EVAL_INVALID_ARGUMENTS");
    process.exitCode = 0;

    const config = path.join(tmp, "agent-inspect.eval.ts");
    await writeFile(config, "export default {};\n", "utf-8");
    result = await runEval(file, { config });
    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_EVAL_INVALID_CONFIG");
    process.exitCode = 0;

    result = await runEval(path.join(tmp, "missing.jsonl"));
    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_EVAL_TRACE_UNREADABLE");
  });
});

describe.skipIf(!builtCliHasEvalCommand)("built eval CLI", () => {
  it("renders eval help from the built command", () => {
    const result = spawnSync(process.execPath, [cliDist, "eval", "--help"], {
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Run deterministic local evals");
    expect(result.stdout).toContain("--require-success");
    expect(result.stdout).toContain("--forbid-tool");
  });
});
