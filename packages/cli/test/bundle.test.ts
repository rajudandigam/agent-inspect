import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bundleCommand } from "../src/bundle.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasBundleCommand =
  existsSync(cliDist) && readFileSync(cliDist, "utf-8").includes("share-safe offline trace bundle");

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
    runId: "run-bundle-safe",
    kind: "RUN",
    name: "bundle-safe",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

async function writeTrace(dir: string, name: string, rows: unknown[]): Promise<void> {
  await writeFile(path.join(dir, name), jsonl(...rows), "utf-8");
}

describe("bundle command", () => {
  let tmp: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-bundle-"));
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("writes a share-safe bundle folder for a clean trace", async () => {
    await writeTrace(tmp, "run-bundle-safe.jsonl", [event("event-a")]);
    const outputDir = path.join(tmp, "bundle-out");

    await bundleCommand("run-bundle-safe", { dir: tmp, out: outputDir, json: true });

    expect(process.exitCode ?? 0).toBe(0);
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      ok: boolean;
      metadata: { safeStatus: string; files: string[] };
    };
    expect(payload.ok).toBe(true);
    expect(payload.metadata.safeStatus).toBe("SAFE");
    expect(payload.metadata.files).toEqual(
      expect.arrayContaining(["trace.html", "trace.jsonl", "summary.md", "metadata.json"]),
    );
    expect(await readFile(path.join(outputDir, "summary.md"), "utf-8")).toContain(
      "AgentInspect trace bundle",
    );
  });

  it("refuses unsafe traces unless --allow-unsafe", async () => {
    const secret = "sk-bundleUnsafeSecret1234567890";
    await writeTrace(tmp, "run-bundle-unsafe.jsonl", [
      event("event-a", {
        runId: "run-bundle-unsafe",
        attributes: { apiKey: secret },
      }),
    ]);
    const outputDir = path.join(tmp, "bundle-unsafe");

    await bundleCommand("run-bundle-unsafe", { dir: tmp, out: outputDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((call) => String(call[0]).includes("refused"))).toBe(true);

    process.exitCode = 0;
    await bundleCommand("run-bundle-unsafe", {
      dir: tmp,
      out: outputDir,
      allowUnsafe: true,
    });
    expect(process.exitCode ?? 0).toBe(0);
    expect(await readFile(path.join(outputDir, "metadata.json"), "utf-8")).toContain(
      "run-bundle-unsafe",
    );
  });

  it("does not mutate the source trace file", async () => {
    const tracePath = path.join(tmp, "run-bundle-mtime.jsonl");
    await writeFile(
      tracePath,
      jsonl(event("event-a", { runId: "run-bundle-mtime" })),
      "utf-8",
    );
    const before = (await stat(tracePath)).mtimeMs;
    const outputDir = path.join(tmp, "bundle-mtime");

    await bundleCommand("run-bundle-mtime", { dir: tmp, out: outputDir });
    const after = (await stat(tracePath)).mtimeMs;
    expect(after).toBe(before);
  });

  it("strips .zip suffix from --out to a folder path", async () => {
    await writeTrace(tmp, "run-bundle-zip.jsonl", [
      event("event-a", { runId: "run-bundle-zip" }),
    ]);
    const outputDir = path.join(tmp, "bundle.zip");

    await bundleCommand("run-bundle-zip", { dir: tmp, out: outputDir });
    expect(existsSync(path.join(tmp, "bundle", "metadata.json"))).toBe(true);
    expect(existsSync(outputDir)).toBe(false);
  });

  it("registers bundle in built CLI when dist exists", () => {
    expect(builtCliHasBundleCommand).toBe(existsSync(cliDist) ? true : true);
  });
});
