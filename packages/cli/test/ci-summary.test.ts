import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTraceArtifactManifest } from "@agent-inspect/core/reporters";

import { ciSummaryCommand } from "../src/ci-summary.js";

describe("ci-summary command", () => {
  let tmp: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-ci-summary-"));
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("summarizes reporter manifests as deterministic JSON and Markdown", async () => {
    const artifactDir = path.join(tmp, "artifacts");
    const manifestPath = path.join(artifactDir, "tests", "agent", "failing", "report.json");
    const output = path.join(tmp, "summary.md");
    const githubSummary = path.join(tmp, "github-step-summary.md");
    const manifest = createTraceArtifactManifest({
      framework: "jest",
      generatedAt: "2026-06-28T00:00:00.000Z",
      results: [
        {
          testId: "agent.test.cjs::failing agent",
          name: "failing agent token=sk-secret123456789",
          file: "agent.test.cjs",
          status: "failed",
          tracePath: "/tmp/raw-trace.jsonl",
          artifacts: [
            {
              kind: "report",
              path: "tests/agent/failing/report.json",
              format: "json",
              redactionProfile: "share",
            },
            {
              kind: "summary",
              path: "tests/agent/failing/summary.md",
              format: "md",
              redactionProfile: "share",
            },
          ],
          diagnostics: [],
        },
      ],
      diagnostics: [],
    });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(
      manifestPath,
      `${JSON.stringify({ package: "@agent-inspect/jest", manifest }, null, 2)}\n`,
      "utf-8",
    );

    await ciSummaryCommand([manifestPath], {
      output,
      githubSummary,
      json: true,
    });

    expect(errSpy.mock.calls.flat().join(" ")).toBe("");
    expect(process.exitCode ?? 0).toBe(0);
    const json = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      status?: string;
      summary?: { failed?: number; tests?: number; artifacts?: number };
      manifests?: Array<{ framework?: string; results?: Array<{ name?: string; tracePath?: string }> }>;
    };
    expect(json.status).toBe("failed");
    expect(json.summary).toMatchObject({ failed: 1, tests: 1, artifacts: 4 });
    expect(json.manifests?.[0]?.framework).toBe("jest");
    expect(json.manifests?.[0]?.results?.[0]?.name).toContain("[REDACTED]");
    expect(json.manifests?.[0]?.results?.[0]?.tracePath).toBe("raw-trace.jsonl");

    const markdown = await readFile(output, "utf-8");
    const appended = await readFile(githubSummary, "utf-8");
    for (const text of [markdown, appended]) {
      expect(text).toContain("AgentInspect CI Summary");
    }
    for (const text of [markdown, appended, JSON.stringify(json)]) {
      expect(text).toContain("AgentInspect");
      expect(text).toContain("raw-trace.jsonl");
      expect(text).toContain("tests/agent/failing/report.json");
      expect(text).not.toContain("sk-secret123456789");
      expect(text).not.toContain(tmp);
      expect(text).not.toContain("/tmp/raw-trace.jsonl");
    }
  });

  it("rejects unsafe reporter artifact paths", async () => {
    const manifestPath = path.join(tmp, "bad-report.json");
    const manifest = createTraceArtifactManifest({
      framework: "vitest",
      generatedAt: "2026-06-28T00:00:00.000Z",
      results: [
        {
          testId: "bad.test.ts::bad path",
          name: "bad path",
          status: "failed",
          artifacts: [
            {
              kind: "report",
              path: "/tmp/escape.json",
              format: "json",
              redactionProfile: "share",
            },
          ],
          diagnostics: [],
        },
      ],
      diagnostics: [],
    });
    await writeFile(manifestPath, `${JSON.stringify({ manifest }, null, 2)}\n`, "utf-8");

    await ciSummaryCommand([manifestPath], { json: true });

    expect(process.exitCode).toBe(1);
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy.mock.calls.flat().join(" ")).toContain("Unsafe reporter artifact path");
  });
});
