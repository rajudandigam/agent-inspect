import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { artifactsCommand } from "../src/artifacts.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasArtifactsCommand =
  existsSync(cliDist) && readFileSync(cliDist, "utf-8").includes("Create safe local CI trace artifacts");

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
    runId: "run-artifacts-cli",
    kind: "RUN",
    name: "artifacts-cli",
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

describe("artifacts command", () => {
  let tmp: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-artifacts-"));
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("writes deterministic safe artifact bundle and GitHub step summary", async () => {
    const rawSecret = "sk-fixtureArtifactSecret123456";
    const rawPrompt = "raw prompt should never enter artifacts";
    const trace = await writeTrace(tmp, "unsafe.jsonl", [
      event("event-a", {
        attributes: {
          apiKey: rawSecret,
          prompt: rawPrompt,
        },
      }),
    ]);
    const outputDir = path.join(tmp, "artifacts");
    const githubSummary = path.join(tmp, "step-summary.md");

    await artifactsCommand(trace, {
      outputDir,
      githubSummary,
      json: true,
    });

    expect(process.exitCode ?? 0).toBe(0);
    const manifest = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      status?: string;
      files?: string[];
      check?: { status?: string; findings?: number };
    };
    expect(manifest.status).toBe("unsafe");
    expect(manifest.check?.status).toBe("fail");
    expect(manifest.check?.findings).toBeGreaterThan(0);
    expect(manifest.files).toEqual([
      "check.json",
      "diff.json",
      "manifest.json",
      "report.html",
      "summary.md",
      "trace.json",
    ]);

    for (const file of manifest.files ?? []) {
      const content = await readFile(path.join(outputDir, file), "utf-8");
      expect(content).not.toContain(rawSecret);
      expect(content).not.toContain(rawPrompt);
    }
    const summary = await readFile(githubSummary, "utf-8");
    expect(summary).toContain("# AgentInspect CI Artifacts");
    expect(summary).not.toContain(rawSecret);
    expect(summary).not.toContain(rawPrompt);
  });

  it("writes baseline diff artifacts when a baseline is supplied", async () => {
    const baseline = await writeTrace(tmp, "baseline.jsonl", [
      event("event-a", {
        kind: "TOOL",
        name: "tool:search",
        attributes: { toolName: "search" },
      }),
    ]);
    const candidate = await writeTrace(tmp, "candidate.jsonl", [
      event("event-a", {
        kind: "TOOL",
        name: "tool:delete",
        attributes: { toolName: "delete" },
      }),
    ]);
    const outputDir = path.join(tmp, "diff-artifacts");

    await artifactsCommand(candidate, {
      outputDir,
      baseline,
      json: true,
    });

    const diff = JSON.parse(await readFile(path.join(outputDir, "diff.json"), "utf-8")) as {
      status?: string;
      findings?: { ruleId?: string }[];
    };
    expect(diff.status).toBe("fail");
    expect(diff.findings?.some((finding) => finding.ruleId === "baseline.regression")).toBe(
      true,
    );
  });

  it("requires an explicit output directory", async () => {
    const trace = await writeTrace(tmp, "safe.jsonl", [event("event-a")]);

    await artifactsCommand(trace);

    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.flat().join(" ")).toContain("--output-dir is required");
  });
});

describe.skipIf(!builtCliHasArtifactsCommand)("built artifacts CLI", () => {
  it("renders artifacts help from the built command", () => {
    const result = spawnSync(process.execPath, [cliDist, "artifacts", "--help"], {
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Create safe local CI trace artifacts");
    expect(result.stdout).toContain("--output-dir");
    expect(result.stdout).toContain("--github-summary");
  });
});
