import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkCommand } from "../src/check.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasCheckCommand =
  existsSync(cliDist) && readFileSync(cliDist, "utf-8").includes("Run deterministic checks");

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
    runId: "run-check-cli",
    kind: "RUN",
    name: "check-cli",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
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

async function runCheck(target: string, options: Parameters<typeof checkCommand>[1] = {}) {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  await checkCommand(target, { json: true, ...options });
  const output = String(logSpy.mock.calls[0]?.[0] ?? "{}");
  logSpy.mockRestore();
  return JSON.parse(output) as {
    status?: string;
    diagnostics?: { code?: string; message?: string }[];
    findings?: { ruleId?: string; message?: string }[];
  };
}

describe("check command", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-check-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("passes a successful local trace through the canonical reader path", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [event("event-a")]);

    const result = await runCheck(file);

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
    expect(result.diagnostics).toEqual([]);
  });

  it("returns exit code 1 for rule failures", async () => {
    const file = await writeTrace(tmp, "error.jsonl", [
      event("event-a", { status: "error" }),
    ]);

    const result = await runCheck(file);

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.[0]?.ruleId).toBe("run.status");
  });

  it("supports explicit format, run selection, run-id lookup, and JSON config", async () => {
    await writeTrace(tmp, "run-check-cli.jsonl", [
      event("event-a", { timestamp: "2026-06-26T00:00:00.000Z" }),
      event("event-b", { timestamp: "2026-06-26T00:00:05.000Z" }),
    ]);
    const config = path.join(tmp, "agent-inspect.config.json");
    await writeFile(
      config,
      JSON.stringify({
        checks: {
          select: ["run.duration"],
          run: { maxDurationMs: 1 },
        },
      }),
      "utf-8",
    );

    const result = await runCheck("run-check-cli", {
      dir: tmp,
      config,
      format: "agent-inspect-jsonl",
      run: "run-check-cli",
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.[0]?.ruleId).toBe("run.duration");
  });

  it("supports JavaScript config and does not leak raw safety values", async () => {
    const file = await writeTrace(tmp, "unsafe.jsonl", [
      event("event-a", {
        attributes: { prompt: "raw prompt should-not-leak" },
      }),
    ]);
    const config = path.join(tmp, "agent-inspect.config.mjs");
    await writeFile(
      config,
      "export default { checks: { select: ['safety.rawPrompt'] } };\n",
      "utf-8",
    );

    const result = await runCheck(file, { config });
    const serialized = JSON.stringify(result);

    expect(process.exitCode).toBe(1);
    expect(result.findings?.[0]?.ruleId).toBe("safety.rawPrompt");
    expect(serialized).not.toContain("should-not-leak");
  });

  it("maps invalid arguments and unsupported TypeScript configs to exit code 2", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [event("event-a")]);

    let result = await runCheck(file, { maxDurationMs: "nope" });
    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_INVALID_ARGUMENTS");
    process.exitCode = 0;

    const config = path.join(tmp, "agent-inspect.config.ts");
    await writeFile(config, "export default {};\n", "utf-8");
    result = await runCheck(file, { config });
    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_INVALID_CONFIG");
  });

  it("maps unreadable and unsupported traces to exit codes 3 and 4", async () => {
    let result = await runCheck(path.join(tmp, "missing.jsonl"));
    expect(process.exitCode).toBe(3);
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_TRACE_UNREADABLE");
    process.exitCode = 0;

    const unsupported = path.join(tmp, "unsupported.json");
    await writeFile(unsupported, "{\"hello\":\"world\"}", "utf-8");
    result = await runCheck(unsupported);
    expect(process.exitCode).toBe(4);
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_UNSUPPORTED_FORMAT");
  });

  it("requires explicit run selection for multi-run inputs", async () => {
    const file = await writeTrace(tmp, "multi.jsonl", [
      event("event-a", { runId: "run-a" }),
      event("event-b", { runId: "run-b" }),
    ]);

    const result = await runCheck(file);

    expect(process.exitCode).toBe(2);
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_RUN_SELECTION_REQUIRED");
  });
});

describe.skipIf(!builtCliHasCheckCommand)("built check CLI", () => {
  it("renders check help from the built command", () => {
    const result = spawnSync(process.execPath, [cliDist, "check", "--help"], {
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Run deterministic checks");
    expect(result.stdout).toContain("--format");
    expect(result.stdout).toContain("--config");
    expect(result.stdout).toContain("--rule");
  });
});
