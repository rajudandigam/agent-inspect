import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { suiteInitCommand } from "../src/suite.js";

const CONFIG_FILENAME = "agent-inspect.suite.json";
const EXISTING_CONFIG_ERROR =
  `${CONFIG_FILENAME} already exists; refusing to overwrite it.`;

describe("suite init", () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-suite-init-"));
    configPath = path.join(tmpDir, CONFIG_FILENAME);
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a parseable starter config when the target is absent", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({ cwd: tmpDir });

    const config = JSON.parse(await readFile(configPath, "utf-8")) as {
      name?: unknown;
      cases?: unknown;
    };
    expect(typeof config.name).toBe("string");
    expect(Array.isArray(config.cases)).toBe(true);
    expect(process.exitCode).not.toBe(1);
  });

  it.each([
    ["valid JSON", '{"name":"keep-me","cases":[]}\n'],
    ["malformed JSON", "{not-json}\n"],
    ["unclosed JSON", '{"name":"broken","cases":[\n'],
    ["empty file", ""],
  ])("preserves an existing %s byte-for-byte", async (_case, original) => {
    await writeFile(configPath, original, "utf-8");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({ cwd: tmpDir });

    expect(await readFile(configPath, "utf-8")).toBe(original);
    expect(errorSpy).toHaveBeenCalledWith(
      `[AgentInspect] suite init failed: ${EXISTING_CONFIG_ERROR}`,
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("does not overwrite an existing config when a template is selected", async () => {
    const original = '{"name":"custom-template-config"}\n';
    await writeFile(configPath, original, "utf-8");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({
      cwd: tmpDir,
      template: "customer-support-agent",
    });

    expect(await readFile(configPath, "utf-8")).toBe(original);
    expect(process.exitCode).toBe(1);
  });

  it("reports an absent target in dry-run without creating it", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({ cwd: tmpDir, dryRun: true, json: true });

    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0]))).toMatchObject({
      ok: true,
      dryRun: true,
      wouldWrite: [CONFIG_FILENAME],
    });
    await expect(readFile(configPath, "utf-8")).rejects.toThrow();
  });

  it("emits one JSON conflict result for an existing target", async () => {
    await writeFile(configPath, "", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await suiteInitCommand({ cwd: tmpDir, json: true });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0]))).toEqual({
      ok: false,
      error: EXISTING_CONFIG_ERROR,
    });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("reports an existing target as a dry-run conflict without writing", async () => {
    const original = '{"name":"keep-dry-run"}\n';
    await writeFile(configPath, original, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({ cwd: tmpDir, dryRun: true, json: true });

    expect(await readFile(configPath, "utf-8")).toBe(original);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0]))).toEqual({
      ok: false,
      error: EXISTING_CONFIG_ERROR,
    });
    expect(process.exitCode).toBe(1);
  });

  it("preserves non-EEXIST filesystem errors", async () => {
    const missingCwd = path.join(tmpDir, "missing-parent");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await suiteInitCommand({ cwd: missingCwd, json: true });

    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      ok: boolean;
      error: string;
    };
    expect(payload.ok).toBe(false);
    expect(payload.error).not.toBe(EXISTING_CONFIG_ERROR);
    expect(payload.error.length).toBeGreaterThan(0);
    expect(process.exitCode).toBe(1);
  });

  it("allows only one concurrent initializer to create the target", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await Promise.all([
      suiteInitCommand({ cwd: tmpDir, json: true }),
      suiteInitCommand({
        cwd: tmpDir,
        template: "customer-support-agent",
        json: true,
      }),
    ]);

    const payloads = logSpy.mock.calls.map(
      (call) => JSON.parse(String(call[0])) as { ok: boolean; error?: string },
    );
    expect(payloads.filter((payload) => payload.ok)).toHaveLength(1);
    expect(
      payloads.filter((payload) => payload.error === EXISTING_CONFIG_ERROR),
    ).toHaveLength(1);
    const createdConfig = await readFile(configPath, "utf-8");
    expect(() => JSON.parse(createdConfig)).not.toThrow();
    expect(process.exitCode).toBe(1);
  });
});
