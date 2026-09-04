import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkCommand, parseCheckConfig, checkConfigHasEffect } from "../src/check.js";

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

  it("rejects unknown nested check config keys", () => {
    expect(() =>
      parseCheckConfig({
        checks: {
          tool: {
            forbiddn: ["send_email"],
          },
        },
      }),
    ).toThrow(/forbiddn/);
  });

  it("rejects top-level contract shape with actionable guidance", () => {
    expect(() =>
      parseCheckConfig({
        contract: {
          tools: {
            forbidden: ["send_email"],
          },
        },
      }),
    ).toThrow(/TraceContract/);
  });

  it("treats empty and effectless configs as having no effect", () => {
    expect(checkConfigHasEffect({})).toBe(false);
    expect(checkConfigHasEffect({ checks: {} })).toBe(false);
    expect(checkConfigHasEffect({ checks: { tool: {} } })).toBe(false);
    expect(
      checkConfigHasEffect({ checks: { tool: { forbidden: ["send_email"] } } }),
    ).toBe(true);
  });

  it("fails explicit --config when the file has no effective rules", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [event("event-a")]);
    const configPath = path.join(tmp, "empty-check.json");
    await writeFile(configPath, JSON.stringify({ checks: {} }), "utf-8");

    const result = await runCheck(file, { config: configPath });

    expect(process.exitCode).toBe(2);
    expect(result.status).toBe("error");
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_CONFIG_NO_EFFECTIVE_RULES");
  });

  it("fails --fail-on-observation when the trace has no outcomes", async () => {
    const file = await writeTrace(tmp, "no-outcome.jsonl", [event("event-a")]);

    const result = await runCheck(file, { failOnObservation: "failed" });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "outcome.status")).toBe(true);
  });

  it("includes rulesEvaluated in JSON output", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [event("event-a")]);

    const result = await runCheck(file);

    expect(result.status).toBe("pass");
    expect((result as { summary?: { rulesEvaluated?: number } }).summary?.rulesEvaluated).toBeGreaterThan(
      0,
    );
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
    expect(result.diagnostics?.[0]?.code).toBe("AI_CHECK_CONFIG_LOAD_FAILED");
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

  it("checks all runs in a session scope", async () => {
    const fixtures = path.resolve(
      testDir,
      "../../../fixtures/sessions/multi-agent-handoff",
    );
    await cp(path.join(fixtures, "handoff-planner.jsonl"), path.join(tmp, "handoff-planner.jsonl"));
    await cp(path.join(fixtures, "handoff-worker.jsonl"), path.join(tmp, "handoff-worker.jsonl"));

    const result = await runCheck(".", {
      dir: tmp,
      session: "sess-handoff-001",
    }) as {
      scopeLabel?: string;
      runIds?: string[];
      status?: string;
      runResults?: Array<{ runId: string; status: string }>;
    };

    expect(result.scopeLabel).toBe("sess-handoff-001");
    expect(result.runIds?.sort()).toEqual(["handoff-planner", "handoff-worker"]);
    expect(result.runResults?.map((item) => item.runId).sort()).toEqual([
      "handoff-planner",
      "handoff-worker",
    ]);
  });

  it("applies trajectory preset without selecting safety rules", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [
      event("event-a", {
        attributes: { prompt: "raw prompt should not fail trajectory" },
      }),
    ]);

    const result = await runCheck(file, { preset: "trajectory" });

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
    expect(result.findings ?? []).toEqual([]);
  });

  it("merges preset select with explicit --rule", async () => {
    const file = await writeTrace(tmp, "ok.jsonl", [
      event("event-a", {
        attributes: { prompt: "raw prompt should-not-leak" },
      }),
    ]);

    const result = await runCheck(file, {
      preset: "trajectory",
      rule: ["safety.rawPrompt"],
    });
    const serialized = JSON.stringify(result);

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "safety.rawPrompt")).toBe(true);
    expect(serialized).not.toContain("should-not-leak");
  });

  it("does not silently expand config select with unrelated configured rules", async () => {
    const file = await writeTrace(tmp, "long.jsonl", [
      event("event-a", {
        timestamp: "2026-06-26T00:00:00.000Z",
        durationMs: 5000,
      }),
    ]);
    const config = path.join(tmp, "select-only-status.json");
    await writeFile(
      config,
      JSON.stringify({
        checks: {
          select: ["run.status"],
          run: { maxDurationMs: 1 },
        },
      }),
      "utf-8",
    );

    const result = await runCheck(file, { config });

    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
    expect(result.findings?.some((item) => item.ruleId === "run.duration")).toBeFalsy();
  });

  it("executes --fail-on-observation with --preset trajectory", async () => {
    const file = await writeTrace(tmp, "failed-outcome.jsonl", [
      event("event-run"),
      event("event-outcome", {
        eventId: "outcome-1",
        kind: "OUTCOME",
        name: "policyShown",
        attributes: {
          outcomeStatus: "failed",
          expectation: "Refund policy visible",
        },
      }),
    ]);

    const result = await runCheck(file, {
      preset: "trajectory",
      failOnObservation: "failed",
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "outcome.status")).toBe(true);
  });

  it("executes --required-tool with --preset safety", async () => {
    const file = await writeTrace(tmp, "no-tool.jsonl", [
      event("event-a", {
        kind: "LLM",
        name: "llm:gpt-4.1-mini",
      }),
    ]);

    const result = await runCheck(file, {
      preset: "safety",
      requiredTool: ["search_docs"],
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "tool.usage")).toBe(true);
  });

  it("treats --forbid-tool as an alias of --forbidden-tool", async () => {
    const file = await writeTrace(tmp, "forbidden-tool.jsonl", [
      event("event-a", {
        kind: "TOOL",
        name: "tool:deleteAccount",
        attributes: { toolName: "deleteAccount" },
      }),
    ]);

    const canonical = await runCheck(file, {
      forbiddenTool: ["deleteAccount"],
    });
    expect(process.exitCode).toBe(1);
    expect(canonical.status).toBe("fail");
    expect(canonical.findings?.filter((item) => item.ruleId === "tool.usage")).toHaveLength(1);

    process.exitCode = 0;
    const alias = await runCheck(file, {
      forbidTool: ["deleteAccount"],
    });
    expect(process.exitCode).toBe(1);
    expect(alias.status).toBe("fail");
    expect(alias.findings?.filter((item) => item.ruleId === "tool.usage")).toHaveLength(1);

    process.exitCode = 0;
    const both = await runCheck(file, {
      forbiddenTool: ["deleteAccount"],
      forbidTool: ["deleteAccount"],
    });
    expect(process.exitCode).toBe(1);
    expect(both.findings?.filter((item) => item.ruleId === "tool.usage")).toHaveLength(1);
  });

  it("executes --allowed-model and --max-total-tokens with --preset trajectory", async () => {
    const file = await writeTrace(tmp, "llm.jsonl", [
      event("event-run"),
      event("event-llm", {
        kind: "LLM",
        name: "llm:gpt-4.1-mini",
        attributes: { model: "gpt-4.1-mini" },
        tokenUsage: { input: 10, output: 10, total: 20 },
      }),
    ]);

    const modelResult = await runCheck(file, {
      preset: "trajectory",
      allowedModel: ["gpt-4o-mini"],
    });
    expect(process.exitCode).toBe(1);
    expect(modelResult.findings?.some((item) => item.ruleId === "llm.usage")).toBe(true);

    process.exitCode = 0;
    const tokenResult = await runCheck(file, {
      preset: "trajectory",
      maxTotalTokens: "1",
    });
    expect(process.exitCode).toBe(1);
    expect(tokenResult.findings?.some((item) => item.ruleId === "llm.usage")).toBe(true);
  });

  it("executes --max-duration-ms with --preset trajectory", async () => {
    const file = await writeTrace(tmp, "slow.jsonl", [
      event("event-a", {
        timestamp: "2026-06-26T00:00:00.000Z",
        durationMs: 5000,
      }),
      event("event-b", {
        eventId: "event-b",
        timestamp: "2026-06-26T00:00:05.000Z",
        durationMs: 1,
      }),
    ]);

    const result = await runCheck(file, {
      preset: "trajectory",
      maxDurationMs: "1",
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "run.duration")).toBe(true);
  });

  it("executes --max-step-duration with --preset trajectory", async () => {
    const file = await writeTrace(tmp, "slow-step.jsonl", [
      event("event-run"),
      event("event-llm", {
        kind: "LLM",
        name: "llm:gpt-4.1-mini",
        durationMs: 5000,
      }),
    ]);

    const result = await runCheck(file, {
      preset: "trajectory",
      maxStepDuration: "1ms",
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "run.maxStepDuration")).toBe(true);
  });

  it("executes --detect-stalls with --preset trajectory", async () => {
    const file = await writeTrace(tmp, "stall.jsonl", [
      event("event-run"),
      event("event-llm", {
        kind: "LLM",
        name: "llm:gpt-4.1-mini",
        status: "running",
      }),
    ]);

    const result = await runCheck(file, {
      preset: "trajectory",
      detectStalls: true,
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(result.findings?.some((item) => item.ruleId === "run.stall")).toBe(true);
  });

  it("writes local evidence on failure when --evidence-on fail", async () => {
    const cwd = process.cwd();
    process.chdir(tmp);
    try {
      const file = await writeTrace(tmp, "error.jsonl", [
        event("event-a", { status: "error" }),
      ]);

      const result = await runCheck(file, { evidenceOn: "fail" });

      expect(process.exitCode).toBe(1);
      expect(result.status).toBe("fail");
      const evidenceJson = path.join(tmp, ".agent-inspect", "evidence", "run-check-cli", "evidence.json");
      expect(existsSync(evidenceJson)).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it("respects --evidence-dir and keeps failure exit code", async () => {
    const evidenceDir = path.join(tmp, "custom-evidence");
    const file = await writeTrace(tmp, "error-dir.jsonl", [
      event("event-a", { status: "error", runId: "run-evidence-dir" }),
    ]);

    const result = await runCheck(file, {
      evidenceOn: "fail",
      evidenceDir,
      evidenceProfile: "share",
      evidenceFormat: "directory",
    });

    expect(process.exitCode).toBe(1);
    expect(result.status).toBe("fail");
    expect(existsSync(path.join(evidenceDir, "evidence.json"))).toBe(true);
    expect(existsSync(path.join(evidenceDir, "evidence.html"))).toBe(true);
  });
});

describe.skipIf(!builtCliHasCheckCommand)("built check CLI", () => {
  it("renders check help from the built command", () => {
    const result = spawnSync(process.execPath, [cliDist, "check", "--help"], {
      encoding: "utf-8",
      env: { ...process.env, NODE_OPTIONS: "" },
      maxBuffer: 4 * 1024 * 1024,
    });

    expect(result.error, result.stderr).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("Run deterministic checks");
    expect(result.stdout).toContain("--format");
    expect(result.stdout).toContain("--config");
    expect(result.stdout).toContain("--rule");
  });

  it("executes trajectory plus --fail-on-observation from the packed CLI", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-packed-check-"));
    try {
      const file = path.join(tmp, "failed-outcome.jsonl");
      await writeFile(
        file,
        jsonl(
          event("event-run"),
          event("event-outcome", {
            eventId: "outcome-1",
            kind: "OUTCOME",
            name: "policyShown",
            attributes: {
              outcomeStatus: "failed",
              expectation: "Refund policy visible",
            },
          }),
        ),
        "utf-8",
      );

      const result = spawnSync(
        process.execPath,
        [
          cliDist,
          "check",
          file,
          "--preset",
          "trajectory",
          "--fail-on-observation",
          "failed",
          "--json",
        ],
        {
          encoding: "utf-8",
          env: { ...process.env, NODE_OPTIONS: "" },
          maxBuffer: 4 * 1024 * 1024,
        },
      );

      expect(result.error, result.stderr).toBeUndefined();
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
      const parsed = JSON.parse(result.stdout) as {
        status?: string;
        findings?: { ruleId?: string }[];
      };
      expect(parsed.status).toBe("fail");
      expect(parsed.findings?.some((item) => item.ruleId === "outcome.status")).toBe(true);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
