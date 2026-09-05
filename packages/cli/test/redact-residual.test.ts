import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redactCommand } from "../src/redact.js";

interface RedactJsonOutput {
  ok?: boolean;
  content?: string;
  findings?: { detector?: string }[];
  residualAssessment?: {
    status?: string;
    basis?: string;
    findingCount?: number;
    highConfidenceFindingCount?: number;
    codes?: string[];
    note?: string;
  };
}

function event(attributes: Record<string, unknown>): string {
  return `${JSON.stringify({
    schemaVersion: "0.2",
    eventId: "event-a",
    runId: "run-residual",
    kind: "RUN",
    name: "residual",
    status: "ok",
    timestamp: "2026-06-26T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    attributes,
  })}\n`;
}

describe("redact residual safety assessment (#328)", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-residual-"));
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmp, { recursive: true, force: true });
  });

  async function writeTrace(name: string, content: string): Promise<string> {
    const file = path.join(tmp, name);
    await writeFile(file, content, "utf-8");
    return file;
  }

  async function redactJson(
    target: string,
    options: Parameters<typeof redactCommand>[1] = {},
  ): Promise<RedactJsonOutput> {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await redactCommand(target, { json: true, ...options });
    const output = String(logSpy.mock.calls[0]?.[0] ?? "{}");
    logSpy.mockRestore();
    return JSON.parse(output) as RedactJsonOutput;
  }

  it("keeps default stdout content and exit code unchanged when residue remains", async () => {
    const file = await writeTrace(
      "residual.jsonl",
      event({ prompt: "raw prompt text", apiKey: "sk-fixtureSecretValue123456789" }),
    );
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await redactCommand(file, { profile: "share" });

    expect(process.exitCode).toBe(0);
    const printed = String(writeSpy.mock.calls[0]?.[0] ?? "");
    expect(printed).toContain("[REDACTED]");
    expect(printed).not.toContain("sk-fixtureSecretValue123456789");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("warns concisely on stderr without printing matched values", async () => {
    const file = await writeTrace(
      "warn.jsonl",
      event({ prompt: "raw prompt text", apiKey: "sk-fixtureSecretValue123456789" }),
    );
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await redactCommand(file, { profile: "share" });

    const stderr = errorSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(stderr).toContain("Residual safety: UNSAFE");
    expect(stderr).toContain("verify-safe");
    expect(stderr).not.toContain("sk-fixtureSecretValue123456789");
    expect(stderr).not.toContain("raw prompt text");
  });

  it("adds an additive residualAssessment to JSON output", async () => {
    const file = await writeTrace(
      "json.jsonl",
      event({ prompt: "raw prompt text", apiKey: "sk-fixtureSecretValue123456789" }),
    );

    const result = await redactJson(file, { profile: "share" });

    expect(result.ok).toBe(true);
    expect(result.residualAssessment?.status).toBe("UNSAFE");
    expect(result.residualAssessment?.basis).toBe("supported-trace");
    expect(result.residualAssessment?.codes).toContain("safety.rawPrompt");
    expect(result.residualAssessment?.highConfidenceFindingCount).toBeGreaterThan(0);
    expect(result.residualAssessment?.note).toContain("not a certification");
    expect(JSON.stringify(result.residualAssessment)).not.toContain("raw prompt text");
    expect(JSON.stringify(result.residualAssessment)).not.toContain(
      "sk-fixtureSecretValue123456789",
    );
  });

  it("reports no residual risk when redaction removes every blocking finding", async () => {
    const file = await writeTrace(
      "cleared.jsonl",
      event({
        token: "sk-abcdefghijklmnopqrstuvwxyz12",
        contact: "pilot.user@example.test",
      }),
    );

    const result = await redactJson(file, { profile: "share" });

    expect(result.residualAssessment?.basis).toBe("supported-trace");
    expect(["SAFE", "SAFE_WITH_WARNINGS"]).toContain(result.residualAssessment?.status);
    expect(result.residualAssessment?.highConfidenceFindingCount).toBe(0);
  });

  it("exits non-zero only with the explicit --fail-on-residual opt-in", async () => {
    const file = await writeTrace("fail.jsonl", event({ prompt: "raw prompt text" }));
    vi.spyOn(console, "log").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share" });
    expect(process.exitCode).toBe(0);

    await redactCommand(file, { json: true, profile: "share", failOnResidual: true });
    expect(process.exitCode).toBe(1);
  });

  it("keeps --fail-on-residual at zero when nothing residual remains", async () => {
    const file = await writeTrace("clean.jsonl", event({ note: "nothing sensitive here" }));
    vi.spyOn(console, "log").mockImplementation(() => {});

    await redactCommand(file, { json: true, profile: "share", failOnResidual: true });

    expect(process.exitCode).toBe(0);
  });

  it("reports detector-only basis for arbitrary JSON that is not a supported trace", async () => {
    const file = path.join(tmp, "doc.json");
    await writeFile(
      file,
      JSON.stringify({ apiKey: "sk-fixtureSecretValue123456789", note: "ok" }),
      "utf-8",
    );

    const result = await redactJson(file, { profile: "share" });

    expect(result.residualAssessment?.basis).toBe("detector-only");
    expect(result.residualAssessment?.note).toContain("not a supported trace");
    expect(result.residualAssessment?.status).toBe("SAFE");
  });

  it("writes a derived copy and never mutates the source", async () => {
    const original = event({ apiKey: "sk-fixtureSecretValue123456789" });
    const file = await writeTrace("source.jsonl", original);
    const output = path.join(tmp, "derived.jsonl");

    await redactCommand(file, { profile: "share", output, failOnResidual: true });

    expect(await readFile(file, "utf-8")).toBe(original);
    expect(await readFile(output, "utf-8")).toContain("[REDACTED]");
  });
});
