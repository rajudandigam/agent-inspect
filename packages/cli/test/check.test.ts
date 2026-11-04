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
    summary?: { rulesEvaluated?: number; failed?: number; errors?: number };
    ruleExecutions?: { ruleId?: string; status?: string; findingCount?: number }[];
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

  it("accepts top-level contract config and rejects typos", () => {
    expect(
      parseCheckConfig({
        contract: {
          tools: {
            forbidden: ["send_email"],
          },
        },
      }),
    ).toEqual({
      contract: {
        tools: {
          forbidden: ["send_email"],
        },
      },
    });
    expect(() =>
      parseCheckConfig({
        contract: {
          tools: {
            forbiddn: ["send_email"],
          },
        },
      }),
    ).toThrow(/forbiddn/);
    expect(
      parseCheckConfig({
        contract: {
          scope: { runId: "r1" },
          tools: { required: ["search"] },
        },
      }),
    ).toEqual({
      contract: {
        scope: { runId: "r1" },
        tools: { required: ["search"] },
      },
    });
    expect(() =>
      parseCheckConfig({
        contract: {
          scope: { runIdd: "r1" },
        },
      }),
    ).toThrow(/runIdd/);
    expect(() =>
      parseCheckConfig({
        checks: { select: ["run.status"] },
        contract: { tools: { required: ["search"] } },
      }),
    ).toThrow(/cannot combine/);
  });

  it("treats empty and effectless configs as having no effect", () => {
    expect(checkConfigHasEffect({})).toBe(false);
    expect(checkConfigHasEffect({ checks: {} })).toBe(false);
    expect(checkConfigHasEffect({ checks: { tool: {} } })).toBe(false);
    expect(
      checkConfigHasEffect({ checks: { tool: { forbidden: ["send_email"] } } }),
    ).toBe(true);
    expect(checkConfigHasEffect({ contract: {} })).toBe(false);
    expect(checkConfigHasEffect({ contract: { scope: { runId: "r1" } } })).toBe(false);
    expect(
      checkConfigHasEffect({ contract: { tools: { required: ["search"] } } }),
    ).toBe(true);
    expect(
      checkConfigHasEffect({
        contract: {
          alternatives: {
            anyOf: [{ id: "a", contract: { tools: { required: ["search"] } } }],
          },
        },
      }),
    ).toBe(true);
    expect(
      checkConfigHasEffect({
        contract: { controls: { requireDeclaredMatchesEnforced: true } },
      }),
    ).toBe(true);
    expect(
      checkConfigHasEffect({ contract: { retry: { maxAttempts: 2 } } }),
    ).toBe(true);
    expect(
      checkConfigHasEffect({
        contract: {
          steps: {
            orderRelations: [
              {
                before: { kind: "TOOL", name: "retrieve_policy" },
                after: { kind: "LLM", name: "generate_answer" },
              },
            ],
          },
        },
      }),
    ).toBe(true);
  });

  it("parses contract.steps.orderRelations and rejects unknown step keys", () => {
    expect(
      parseCheckConfig({
        contract: {
          steps: {
            orderRelations: [
              {
                before: { kind: "TOOL", name: "retrieve_policy" },
                after: { kind: "LLM", name: "generate_answer" },
                mode: "happens-before",
                requireEndpoints: true,
              },
            ],
          },
        },
      }),
    ).toEqual({
      contract: {
        steps: {
          orderRelations: [
            {
              before: { kind: "TOOL", name: "retrieve_policy" },
              after: { kind: "LLM", name: "generate_answer" },
              mode: "happens-before",
              requireEndpoints: true,
            },
          ],
        },
      },
    });
    expect(() =>
      parseCheckConfig({
        contract: {
          steps: {
            orderRelations: [
              {
                before: { kind: "TOOL", name: "a" },
                after: { kind: "LLM", name: "b" },
                occurrenceMode: "first-occurrence",
              },
            ],
          },
        },
      }),
    ).toThrow(/Unknown check config key "contract\.steps\.orderRelations\[0\]\.occurrenceMode"/);
    expect(() =>
      parseCheckConfig({
        contract: {
          steps: {
            orderRelations: [{ before: { kind: "LOGIC", name: "x" }, after: { kind: "LLM", name: "y" } }],
          },
        },
      }),
    ).toThrow(/kind must be "TOOL" or "LLM"/);
  });

  it("parses contract scope, alternatives, and rejects nested/unknown keys", () => {
    expect(
      parseCheckConfig({
        contract: {
          alternatives: {
            anyOf: [
              {
                id: "with-search",
                description: "search path",
                contract: { tools: { required: ["search"] } },
              },
              {
                id: "with-lookup",
                contract: { tools: { required: ["lookup"] } },
              },
            ],
          },
        },
      }),
    ).toEqual({
      contract: {
        alternatives: {
          anyOf: [
            {
              id: "with-search",
              description: "search path",
              contract: { tools: { required: ["search"] } },
            },
            {
              id: "with-lookup",
              contract: { tools: { required: ["lookup"] } },
            },
          ],
        },
      },
    });
    expect(() =>
      parseCheckConfig({
        contract: {
          tools: {
            arguments: [{ tool: "search", path: "/q", operator: "exists", typo: true }],
          },
        },
      }),
    ).toThrow(/typo/);
    expect(() =>
      parseCheckConfig({
        contract: {
          alternatives: {
            anyOf: [
              {
                id: "nested",
                contract: {
                  tools: { required: ["search"] },
                  alternatives: {
                    anyOf: [{ id: "inner", contract: { tools: { required: ["x"] } } }],
                  },
                },
              },
            ],
          },
        },
      }),
    ).toThrow(/alternatives/);
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

  it("rejects obsolete structure.minConfidence values", () => {
    expect(() =>
      parseCheckConfig({
        checks: {
          structure: { minConfidence: "exact" },
        },
      }),
    ).toThrow(/unknown, heuristic, correlated, explicit/);
    expect(() =>
      parseCheckConfig({
        checks: {
          structure: { minConfidence: "high" },
        },
      }),
    ).toThrow(/minConfidence/);
  });

  it("accepts canonical structure.minConfidence values", () => {
    expect(
      parseCheckConfig({
        checks: {
          structure: { minConfidence: "explicit" },
        },
      }).checks?.structure?.minConfidence,
    ).toBe("explicit");
    expect(
      parseCheckConfig({
        checks: {
          structure: { minConfidence: "unknown" },
        },
      }).checks?.structure?.minConfidence,
    ).toBe("unknown");
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

  it("sets evidence assessment from residual safety, not check pass/fail (#519)", async () => {
    const failEvidenceDir = path.join(tmp, "evidence-fail-clean");
    const failFile = await writeTrace(tmp, "fail-clean.jsonl", [
      event("event-a", { status: "error", runId: "run-fail-clean" }),
    ]);
    const failResult = await runCheck(failFile, {
      evidenceOn: "fail",
      evidenceDir: failEvidenceDir,
      evidenceProfile: "share",
    });
    expect(failResult.status).toBe("fail");
    const failAssessment = JSON.parse(
      readFileSync(path.join(failEvidenceDir, "evidence.json"), "utf-8"),
    ) as { assessment?: { status?: string } };
    expect(failAssessment.assessment?.status).toBe("SAFE");

    // Glued OpenAI-shaped key: share redactor is \\b-anchored and leaves it;
    // verify-safe openai-key is unanchored and marks residual UNSAFE.
    // trajectory preset excludes safety.secretPattern so the check can pass.
    process.exitCode = 0;
    const glued = "acct_sk-proj-FAKEevalNOTrealKEY000000";
    const passEvidenceDir = path.join(tmp, "evidence-pass-unsafe");
    const passFile = await writeTrace(tmp, "pass-unsafe.jsonl", [
      event("event-a", {
        runId: "run-pass-unsafe",
        attributes: { paymentRef: glued },
      }),
    ]);
    const passResult = await runCheck(passFile, {
      preset: "trajectory",
      evidenceOn: "always",
      evidenceDir: passEvidenceDir,
      evidenceProfile: "share",
    });
    expect(
      passResult.status,
      JSON.stringify(passResult.findings ?? passResult.diagnostics),
    ).toBe("pass");
    expect(process.exitCode ?? 0).toBe(0);
    const passAssessment = JSON.parse(
      readFileSync(path.join(passEvidenceDir, "evidence.json"), "utf-8"),
    ) as { assessment?: { status?: string } };
    expect(passAssessment.assessment?.status).toBe("UNSAFE");
    expect(readFileSync(path.join(passEvidenceDir, "trace.jsonl"), "utf-8")).toContain(glued);

    // #529: check-results aggregateStatus matches residual assessment, not check pass/fail.
    const failChecks = JSON.parse(
      readFileSync(path.join(failEvidenceDir, "check-results.json"), "utf-8"),
    ) as { aggregateStatus?: string; checkStatus?: string };
    expect(failChecks.aggregateStatus).toBe("SAFE");
    expect(failChecks.checkStatus).toBe("fail");
    const passChecks = JSON.parse(
      readFileSync(path.join(passEvidenceDir, "check-results.json"), "utf-8"),
    ) as { aggregateStatus?: string; checkStatus?: string };
    expect(passChecks.aggregateStatus).toBe("UNSAFE");
    expect(passChecks.checkStatus).toBe("pass");
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

  it("records selected circuit rules in ruleExecutions and Evidence JSON", async () => {
    const file = await writeTrace(tmp, "circuit-account.jsonl", [
      event("tool-1", {
        eventId: "t1",
        kind: "TOOL",
        name: "retrieve_policy",
        attributes: { toolName: "retrieve_policy" },
      }),
      event("tool-2", {
        eventId: "t2",
        kind: "TOOL",
        name: "retrieve_policy",
        attributes: { toolName: "retrieve_policy" },
      }),
      event("tool-3", {
        eventId: "t3",
        kind: "TOOL",
        name: "retrieve_policy",
        attributes: { toolName: "retrieve_policy" },
      }),
      event("tool-4", {
        eventId: "t4",
        kind: "TOOL",
        name: "retrieve_policy",
        attributes: { toolName: "retrieve_policy" },
      }),
    ]);
    const evidenceDir = path.join(tmp, "evidence-out");
    const result = await runCheck(file, {
      requireCompleted: true,
      circuit: ["same-tool-repetition"],
      evidenceOn: "fail",
      evidenceDir,
      evidenceProfile: "local",
    });
    expect(result.status).toBe("fail");
    expect(
      result.ruleExecutions?.some((item) => item.ruleId === "circuit.same-tool-repetition"),
    ).toBe(true);
    expect(result.summary?.rulesEvaluated).toBeGreaterThanOrEqual(2);
    expect(result.ruleExecutions?.some((item) => item.ruleId === "run.requireCompleted")).toBe(
      true,
    );
    const checkResultsPath = path.join(evidenceDir, "check-results.json");
    expect(existsSync(checkResultsPath)).toBe(true);
    const evidenceChecks = JSON.parse(readFileSync(checkResultsPath, "utf-8")) as {
      evaluatedRuleIds?: string[];
      rulesEvaluated?: number;
    };
    expect(evidenceChecks.evaluatedRuleIds).toContain("circuit.same-tool-repetition");
    expect(evidenceChecks.rulesEvaluated).toBe(result.summary?.rulesEvaluated);
  });

  it("evaluates top-level contract config for required and forbidden tools", async () => {
    const file = await writeTrace(tmp, "contract-tools.jsonl", [
      event("event-run"),
      event("event-tool", {
        kind: "TOOL",
        name: "tool:search",
        attributes: { toolName: "search" },
      }),
    ]);

    const passConfig = path.join(tmp, "contract-pass.json");
    await writeFile(
      passConfig,
      JSON.stringify({ contract: { tools: { required: ["search"] } } }),
      "utf-8",
    );
    const pass = await runCheck(file, { config: passConfig });
    expect(process.exitCode).toBe(0);
    expect(pass.status).toBe("pass");
    expect((pass.summary?.rulesEvaluated ?? 0) > 0).toBe(true);

    process.exitCode = 0;
    const failConfig = path.join(tmp, "contract-fail.json");
    await writeFile(
      failConfig,
      JSON.stringify({ contract: { tools: { forbidden: ["search"] } } }),
      "utf-8",
    );
    const fail = await runCheck(file, { config: failConfig });
    expect(process.exitCode).toBe(1);
    expect(fail.status).toBe("fail");
    expect(fail.findings?.some((item) => item.ruleId === "tool.usage")).toBe(true);
  });

  it("evaluates contract scope with required tools", async () => {
    const file = await writeTrace(tmp, "contract-scope.jsonl", [
      event("event-run", {
        attributes: { metadata: { groupId: "g1" } },
      }),
      event("event-tool", {
        kind: "TOOL",
        name: "tool:search",
        attributes: { toolName: "search" },
      }),
    ]);

    const configPath = path.join(tmp, "contract-scope.json");
    await writeFile(
      configPath,
      JSON.stringify({
        contract: {
          scope: { runId: "run-check-cli" },
          tools: { required: ["search"] },
        },
      }),
      "utf-8",
    );
    const result = await runCheck(file, { config: configPath });
    expect(process.exitCode).toBe(0);
    expect(result.status).toBe("pass");
    expect((result.summary?.rulesEvaluated ?? 0) > 0).toBe(true);
  });

  it("binds TraceContract into Evidence when --evidence-on is used with contract config", async () => {
    const file = await writeTrace(tmp, "contract-evidence.jsonl", [
      event("event-run"),
      event("event-tool", {
        kind: "TOOL",
        name: "tool:search",
        attributes: { toolName: "search" },
      }),
    ]);
    const configPath = path.join(tmp, "contract-evidence.json");
    await writeFile(
      configPath,
      JSON.stringify({ contract: { tools: { forbidden: ["search"] } } }),
      "utf-8",
    );
    const evidenceDir = path.join(tmp, "evidence-contract");
    const result = await runCheck(file, {
      config: configPath,
      evidenceOn: "fail",
      evidenceDir,
      evidenceProfile: "local",
    });
    expect(result.status).toBe("fail");
    expect(existsSync(path.join(evidenceDir, "contract.resolved.json"))).toBe(true);
    expect(existsSync(path.join(evidenceDir, "check-results.json"))).toBe(true);
    const checkResults = JSON.parse(
      readFileSync(path.join(evidenceDir, "check-results.json"), "utf-8"),
    ) as {
      contract?: {
        bindingStatus?: string;
        origin?: { source?: string };
      };
    };
    expect(checkResults.contract?.bindingStatus).toBe("complete");
    expect(checkResults.contract?.origin?.source).toBe("file");
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
      expect(
        result.stdout.trim().length > 0,
        `expected JSON stdout from packed check CLI\nstdout=${JSON.stringify(result.stdout)}\nstderr=${result.stderr}`,
      ).toBe(true);
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

  it("packed CLI rejects obsolete minConfidence and fails heuristic below explicit", async () => {
    if (!builtCliHasCheckCommand) {
      return;
    }
    const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-packed-conf-"));
    try {
      const file = path.join(tmp, "heuristic.jsonl");
      await writeFile(
        file,
        jsonl(event("event-a", { confidence: "heuristic", kind: "LOGIC", name: "step" })),
        "utf-8",
      );
      const badConfig = path.join(tmp, "bad.json");
      await writeFile(
        badConfig,
        JSON.stringify({
          checks: { select: ["structure.relationship"], structure: { minConfidence: "exact" } },
        }),
        "utf-8",
      );
      const goodConfig = path.join(tmp, "good.json");
      await writeFile(
        goodConfig,
        JSON.stringify({
          checks: {
            select: ["structure.relationship"],
            structure: { minConfidence: "explicit" },
          },
        }),
        "utf-8",
      );
      const passConfig = path.join(tmp, "pass.json");
      await writeFile(
        passConfig,
        JSON.stringify({
          checks: {
            select: ["structure.relationship"],
            structure: { minConfidence: "heuristic" },
          },
        }),
        "utf-8",
      );

      const invalid = spawnSync(
        process.execPath,
        [cliDist, "check", file, "--config", badConfig, "--json"],
        {
          encoding: "utf-8",
          env: { ...process.env, NODE_OPTIONS: "" },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      expect(invalid.status, `${invalid.stdout}\n${invalid.stderr}`).toBe(2);

      const fail = spawnSync(
        process.execPath,
        [cliDist, "check", file, "--config", goodConfig, "--json"],
        {
          encoding: "utf-8",
          env: { ...process.env, NODE_OPTIONS: "" },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      expect(fail.status, `${fail.stdout}\n${fail.stderr}`).toBe(1);
      const failParsed = JSON.parse(fail.stdout) as { status?: string };
      expect(failParsed.status).toBe("fail");

      const pass = spawnSync(
        process.execPath,
        [cliDist, "check", file, "--config", passConfig, "--json"],
        {
          encoding: "utf-8",
          env: { ...process.env, NODE_OPTIONS: "" },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      expect(pass.status, `${pass.stdout}\n${pass.stderr}`).toBe(0);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("packed CLI fails unknown --circuit without silent green accounting", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-packed-circuit-"));
    try {
      const file = path.join(tmp, "unknown-circuit.jsonl");
      await writeFile(
        file,
        jsonl(
          event("tool-a", {
            eventId: "ta",
            kind: "TOOL",
            name: "search",
            attributes: { toolName: "search" },
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
          "--require-completed",
          "--circuit",
          "not-a-real-circuit",
          "--json",
        ],
        {
          encoding: "utf-8",
          env: { ...process.env, NODE_OPTIONS: "" },
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
      const parsed = JSON.parse(result.stdout) as {
        status?: string;
        ruleExecutions?: { ruleId?: string; status?: string }[];
        summary?: { rulesEvaluated?: number };
      };
      expect(parsed.status).toBe("error");
      expect(
        parsed.ruleExecutions?.some(
          (item) => item.ruleId === "not-a-real-circuit" && item.status === "error",
        ),
      ).toBe(true);
      expect(parsed.summary?.rulesEvaluated).toBeGreaterThanOrEqual(1);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
