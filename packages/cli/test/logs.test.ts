import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logs } from "../src/logs.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const sampleJson = path.join(repoRoot, "examples/06-log-to-tree/sample-json.log");
const sampleLog4 = path.join(repoRoot, "examples/06-log-to-tree/sample-log4js.log");
const sampleConfig = path.join(repoRoot, "examples/06-log-to-tree/agent-inspect.logs.json");

describe("logs", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-logs-"));
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("--format json renders expected markers", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(sampleJson, { format: "json", config: sampleConfig });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run 01fe6bf1");
    expect(out).toContain("job:started");
    expect(out).toContain("tool:get_conversation_history");
    expect(out).toContain("llm:generate_message");
    expect(out).toContain("confidence:");
    expect(out).toContain("user=");
    expect(out).toContain("trip=");
    logSpy.mockRestore();
  });

  it("--format log4js renders expected markers", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(sampleLog4, { format: "log4js", config: sampleConfig });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run 01fe6bf1");
    expect(out).toContain("job:started");
    logSpy.mockRestore();
  });

  it("--format auto detects JSON and log4js", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(sampleJson, { format: "auto", config: sampleConfig });
    await logs(sampleLog4, { format: "auto", config: sampleConfig });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run 01fe6bf1");
    logSpy.mockRestore();
  });

  it("--json returns parseable object with summary", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(sampleJson, { format: "json", config: sampleConfig, json: true });
    const raw = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(raw) as any;
    expect(parsed).toHaveProperty("events");
    expect(parsed).toHaveProperty("trees");
    expect(parsed).toHaveProperty("warnings");
    expect(parsed).toHaveProperty("summary");
    expect(parsed.summary).toHaveProperty("runs");
    logSpy.mockRestore();
  });

  it("--warnings none hides warnings (human)", async () => {
    const file = path.join(tmpDir, "bad.jsonl");
    await writeFile(file, "{ not json\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(file, { format: "json", warnings: "none" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toContain("Warnings:");
    logSpy.mockRestore();
  });

  it("--warnings all prints details for malformed JSON", async () => {
    const file = path.join(tmpDir, "bad.jsonl");
    await writeFile(file, "{ not json\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await logs(file, { format: "json", warnings: "all" });
    const joined = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("Warnings:");
    expect(joined).toContain("MALFORMED_JSON");
    // no valid events -> should set exitCode
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("missing file fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await logs("/no/such/file.log", { format: "json" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("logs failed"))).toBe(
      true,
    );
    errSpy.mockRestore();
  });

  it("invalid warnings mode fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // @ts-expect-error test invalid mode
    await logs(sampleJson, { format: "json", warnings: "nope" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Invalid --warnings"))).toBe(
      true,
    );
    errSpy.mockRestore();
  });

  it("--run-id-key override works (comma-separated)", async () => {
    const file = path.join(tmpDir, "custom.jsonl");
    const now = Date.now();
    await writeFile(
      file,
      JSON.stringify({ jobId: "job1", event: "proactive.job.started", timestamp: now }) +
        "\n",
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await logs(file, {
      format: "json",
      runIdKey: "jobId",
      eventKey: "event",
      timestampKey: "timestamp",
    });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run job1");
    logSpy.mockRestore();
  });
});

