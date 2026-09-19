import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tail } from "../src/tail.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const sampleJson = path.join(repoRoot, "examples/06-log-to-tree/sample-json.log");
const sampleLog4 = path.join(repoRoot, "examples/06-log-to-tree/sample-log4js.log");
const sampleConfig = path.join(repoRoot, "examples/06-log-to-tree/agent-inspect.logs.json");
const followRefreshMs = 20;

function waitForFollowPolls(count: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, followRefreshMs * count));
}

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
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await tail({ file: badLog, once: true, format: "json", warnings: "none" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toContain("Warnings:");
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("No valid events found"))).toBe(true);
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("--warnings all prints warning details", async () => {
    const badLog = path.join(tmpDir, "bad.jsonl");
    await writeFile(badLog, "{ not json\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await tail({ file: badLog, once: true, format: "json", warnings: "all" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Warnings:");
    expect(out).toContain("MALFORMED_JSON");
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("No valid events found"))).toBe(true);
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("--json --once prints parseable JSON and exits non-zero when no valid events", async () => {
    const badLog = path.join(tmpDir, "bad.jsonl");
    await writeFile(badLog, "{ not json\n", "utf-8");
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => true as any);
    await tail({ file: badLog, once: true, format: "json", json: true, warnings: "all" });
    const joined = writeSpy.mock.calls.map((c) => String(c[0])).join("");
    const lines = joined.split("\n").filter((l) => l.trim() !== "");
    const obj = JSON.parse(lines[lines.length - 1]!) as any;
    expect(obj).toHaveProperty("events");
    expect(obj).toHaveProperty("warnings");
    expect(process.exitCode).toBe(1);
    writeSpy.mockRestore();
  });

  it("one valid event keeps exit code 0 even with warnings", async () => {
    const file = path.join(tmpDir, "mix.jsonl");
    await writeFile(
      file,
      "{ not json\n" +
        JSON.stringify({ event: "proactive.job.started", decisionId: "d1", timestamp: 1 }) +
        "\n",
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await tail({ file, once: true, format: "json", warnings: "all" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run d1");
    expect(process.exitCode).toBe(0);
    logSpy.mockRestore();
  });

  it.each([
    { label: "3-byte character split after its first byte", character: "你", splitAt: 1 },
    { label: "3-byte character split after its second byte", character: "你", splitAt: 2 },
    { label: "4-byte character split in the middle", character: "🙂", splitAt: 2 },
  ])("preserves valid UTF-8 for $label across follow reads", async ({ character, splitAt }) => {
    const { appendFile } = await import("node:fs/promises");
    const { followFile } = await import("../src/tail.js");
    const file = path.join(tmpDir, `utf8-follow-${splitAt}-${character.codePointAt(0)}.log`);
    await writeFile(file, "", "utf-8");

    const lines: string[] = [];
    let stop = false;
    const follower = followFile(
      file,
      { refreshMs: followRefreshMs, once: false },
      (line) => {
        lines.push(line);
      },
      () => stop,
    );

    try {
      await waitForFollowPolls(2);

      const prefix = '{"message":"';
      const suffix = '"}';
      const encoded = Buffer.from(character, "utf-8");
      await appendFile(
        file,
        Buffer.concat([Buffer.from(prefix, "utf-8"), encoded.subarray(0, splitAt)]),
      );
      await waitForFollowPolls(3);
      expect(lines).toEqual([]);

      await appendFile(
        file,
        Buffer.concat([
          encoded.subarray(splitAt),
          Buffer.from(`${suffix}\n`, "utf-8"),
        ]),
      );
      await waitForFollowPolls(4);

      expect(lines).toEqual([`${prefix}${character}${suffix}`]);
      expect(lines[0]).not.toContain("\uFFFD");
    } finally {
      stop = true;
      await follower;
    }
  });

  it("preserves valid UTF-8 after truncation drops pending decoder bytes", async () => {
    const { appendFile, truncate } = await import("node:fs/promises");
    const { followFile } = await import("../src/tail.js");
    const file = path.join(tmpDir, "utf8-truncate-follow.log");
    await writeFile(file, "", "utf-8");

    const lines: string[] = [];
    let stop = false;
    const follower = followFile(
      file,
      { refreshMs: followRefreshMs, once: false },
      (line) => {
        lines.push(line);
      },
      () => stop,
    );

    try {
      await waitForFollowPolls(2);

      const encoded = Buffer.from("🙂", "utf-8");
      await appendFile(file, encoded.subarray(0, 2));
      await waitForFollowPolls(3);
      expect(lines).toEqual([]);

      await truncate(file, 0);
      await waitForFollowPolls(3);

      const replacementLine = '{"message":"truncate recovery ✅"}';
      await appendFile(file, `${replacementLine}\n`, "utf-8");
      await waitForFollowPolls(4);

      expect(lines).toEqual([replacementLine]);
      expect(lines[0]).not.toContain("\uFFFD");
    } finally {
      stop = true;
      await follower;
    }
  });

  it("recovers after file truncation without emitting stale partial lines", async () => {
    const { appendFile, truncate } = await import("node:fs/promises");
    const { followFile } = await import("../src/tail.js");
    const file = path.join(tmpDir, "truncate-follow.log");
    await writeFile(file, "", "utf-8");

    const lines: string[] = [];
    let stop = false;
    const follower = followFile(
      file,
      { refreshMs: 20, once: false },
      (line) => {
        lines.push(line);
      },
      () => stop,
    );

    // Wait until follower is past initial end-of-file seek.
    await new Promise((r) => setTimeout(r, 40));

    const eventA = JSON.stringify({
      event: "proactive.job.started",
      decisionId: "run-a",
      timestamp: 1,
    });
    await appendFile(file, `${eventA}\n`, "utf-8");
    await new Promise((r) => setTimeout(r, 60));
    expect(lines.some((l) => l.includes("run-a"))).toBe(true);

    await appendFile(file, '{"partial', "utf-8");
    await new Promise((r) => setTimeout(r, 60));

    await truncate(file, 0);
    const eventB = JSON.stringify({
      event: "proactive.job.started",
      decisionId: "run-b",
      timestamp: 2,
    });
    await writeFile(file, `${eventB}\n`, "utf-8");
    await new Promise((r) => setTimeout(r, 80));

    expect(lines.some((l) => l.includes("run-b"))).toBe(true);
    expect(lines.some((l) => l.includes('{"partial'))).toBe(false);
    expect(stop).toBe(false);

    stop = true;
    await follower;
  });
});
