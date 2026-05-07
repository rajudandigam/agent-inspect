import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tail } from "../src/tail.js";

const sampleJson = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/sample-json.log",
);
const sampleLog4 = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/sample-log4js.log",
);
const sampleConfig = path.resolve(
  process.cwd(),
  "examples/06-log-to-tree/agent-inspect.logs.json",
);

describe("tail", () => {
  let tmpDir: string;
  let originalIsTty: boolean | undefined;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-tail-"));
    process.exitCode = 0;
    vi.restoreAllMocks();
    originalIsTty = process.stdout.isTTY;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    // @ts-expect-error restore test override
    process.stdout.isTTY = originalIsTty;
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("--file --once parses JSON file and renders expected markers", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await tail({
      file: sampleJson,
      once: true,
      format: "json",
      config: sampleConfig,
      warnings: "none",
    });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run 01fe6bf1");
    expect(out).toContain("job:started");
    expect(out).toContain("confidence:");
    logSpy.mockRestore();
  });

  it("--file --once parses log4js file and renders expected markers", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await tail({
      file: sampleLog4,
      once: true,
      format: "log4js",
      config: sampleConfig,
      warnings: "none",
    });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run 01fe6bf1");
    expect(out).toContain("job:started");
    logSpy.mockRestore();
  });

  it("--json --once prints parseable JSON", async () => {
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => true as any);
    await tail({
      file: sampleJson,
      once: true,
      format: "json",
      config: sampleConfig,
      json: true,
      warnings: "none",
    });
    const joined = writeSpy.mock.calls.map((c) => String(c[0])).join("");
    const lines = joined.split("\n").filter((l) => l.trim() !== "");
    expect(lines.length).toBeGreaterThan(0);
    const obj = JSON.parse(lines[lines.length - 1]!) as any;
    expect(obj).toHaveProperty("events");
    expect(obj).toHaveProperty("trees");
    expect(obj).toHaveProperty("summary");
    writeSpy.mockRestore();
  });

  it("invalid --refresh fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await tail({ file: sampleJson, once: true, refresh: "nope" });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("tail failed"))).toBe(true);
    errSpy.mockRestore();
  });

  it("missing file fails clearly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await tail({ file: "/no/such/file.log", once: true });
    expect(process.exitCode).toBe(1);
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes("Log file does not exist")),
    ).toBe(true);
    errSpy.mockRestore();
  });

  it("invalid config fails clearly", async () => {
    const bad = path.join(tmpDir, "bad.json");
    await writeFile(bad, "{ not json", "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await tail({ file: sampleJson, once: true, config: bad });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("tail failed"))).toBe(true);
    errSpy.mockRestore();
  });

  it("--warnings none hides warnings section", async () => {
    const badLog = path.join(tmpDir, "bad.jsonl");
    await writeFile(badLog, "{ not json\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await tail({ file: badLog, once: true, format: "json", warnings: "none" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toContain("Warnings:");
    logSpy.mockRestore();
  });

  it("--warnings all prints warning details", async () => {
    const badLog = path.join(tmpDir, "bad.jsonl");
    await writeFile(badLog, "{ not json\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await tail({ file: badLog, once: true, format: "json", warnings: "all" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Warnings:");
    expect(out).toContain("MALFORMED_JSON");
    logSpy.mockRestore();
  });

  it("--no-clear does not emit clear-screen sequences", async () => {
    (process.stdout as any).isTTY = true;
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => true as any);
    await tail({
      file: sampleJson,
      once: true,
      format: "json",
      config: sampleConfig,
      warnings: "none",
      noClear: true,
    });
    const written = writeSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(written).not.toContain("\x1b[2J\x1b[0f");
    writeSpy.mockRestore();
  });
});

