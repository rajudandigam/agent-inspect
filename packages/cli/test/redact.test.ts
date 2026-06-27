import { PassThrough } from "node:stream";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redactCommand } from "../src/redact.js";

function stdinFrom(text: string): NodeJS.ReadableStream {
  const stream = new PassThrough();
  stream.end(text);
  return stream;
}

async function writeTrace(dir: string, content: string): Promise<string> {
  const file = path.join(dir, "trace.jsonl");
  await writeFile(file, content, "utf-8");
  return file;
}

describe("redact command", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-redact-cli-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  it("redacts JSONL deterministically without leaking findings values", async () => {
    const file = await writeTrace(
      tmp,
      `${JSON.stringify({
        schemaVersion: "0.2",
        eventId: "event-a",
        runId: "run-redact-cli",
        attributes: {
          apiKey: "sk-fixtureSecretValue123456789",
          emailNote: "owner@example.test",
          safe: "ok",
        },
      })}\n`,
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share" });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      content?: string;
      findings?: { detector?: string; path?: string }[];
    };
    expect(result.content).not.toContain("sk-fixtureSecretValue123456789");
    expect(result.content).not.toContain("owner@example.test");
    expect(result.content).toContain("[REDACTED]");
    expect(result.findings?.map((finding) => finding.detector)).toContain("key.apikey");
    expect(result.findings?.map((finding) => finding.detector)).toContain("value.email");
    expect(JSON.stringify(result.findings)).not.toContain("owner@example.test");
  });

  it("writes redacted output files without printing content", async () => {
    const output = path.join(tmp, "safe.json");
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await redactCommand(
      "-",
      { output, profile: "share" },
      stdinFrom(JSON.stringify({ authorization: "Bearer tokenValue1234567890", safe: "ok" })),
    );

    const redacted = await readFile(output, "utf-8");
    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain("tokenValue1234567890");
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("fails malformed JSONL without echoing the bad line", async () => {
    await expect(
      redactCommand("-", {}, stdinFrom("{\"token\":\"secret\"}\nnot-json-secret\n")),
    ).rejects.toThrow("Input is not valid JSON or JSONL at line 2.");
  });
});
