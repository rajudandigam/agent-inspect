import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveRedactionProfile } from "@agent-inspect/core/advanced";
import { createRedactionProfile } from "@agent-inspect/redact";

import { bundleCommand } from "../src/bundle.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");
const cliDist = path.join(repoRoot, "packages/cli/dist/index.cjs");
const builtCliHasBundleCommand =
  existsSync(cliDist) &&
  readFileSync(cliDist, "utf-8").includes("bundle requires a run id");

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

async function readTreeText(dir: string): Promise<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  const parts: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      parts.push(await readTreeText(full));
    } else {
      parts.push(await readFile(full, "utf-8"));
    }
  }
  return parts.join("\n");
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
      expect.arrayContaining([
        "trace.html",
        "trace.jsonl",
        "summary.md",
        "metadata.json",
        "evidence.json",
        "evidence.html",
      ]),
    );
    expect(await readFile(path.join(outputDir, "summary.md"), "utf-8")).toContain(
      "AgentInspect trace bundle",
    );
    const evidenceHtml = await readFile(path.join(outputDir, "evidence.html"), "utf-8");
    expect(evidenceHtml).toContain("Content-Security-Policy");
    expect(evidenceHtml).toContain("run-bundle-safe");
    expect(evidenceHtml).toContain('id="view-tree"');
    expect(evidenceHtml).toContain('id="view-timeline"');
    expect(evidenceHtml).toContain('id="view-causal"');
    expect(evidenceHtml).toContain('id="view-contracts"');
    expect(evidenceHtml).toContain('id="view-outcomes"');
    expect(evidenceHtml).toContain('id="view-diff"');
    expect(evidenceHtml).toContain('id="view-safety"');
    expect(evidenceHtml).toContain('id="view-provenance"');
    expect(evidenceHtml).toContain('id="view-tools-llm"');
    const evidence = JSON.parse(
      await readFile(path.join(outputDir, "evidence.json"), "utf-8"),
    ) as {
      evidenceFormatVersion: string;
      files: { path: string; sha256: string }[];
    };
    expect(evidence.evidenceFormatVersion).toBe("1.0");
    expect(evidence.files.some((f) => f.path === "evidence.html")).toBe(true);
    expect(evidence.files.every((f) => f.path !== "evidence.json")).toBe(true);
  });

  it("allows redactable secrets when the artifact assessment is safe", async () => {
    const secret = "sk-bundleRedactedSecret1234567890";
    await writeTrace(tmp, "run-bundle-redactable.jsonl", [
      event("event-a", {
        runId: "run-bundle-redactable",
        attributes: { apiKey: secret },
      }),
    ]);
    const outputDir = path.join(tmp, "bundle-redactable");

    await bundleCommand("run-bundle-redactable", { dir: tmp, out: outputDir, json: true });
    expect(process.exitCode ?? 0).toBe(0);
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      ok: boolean;
      checks?: { runs?: { status?: string; sourceStatus?: string }[] };
    };
    expect(payload.ok).toBe(true);
    expect(payload.checks?.runs?.[0]?.sourceStatus).toBe("UNSAFE");
    expect(["SAFE", "SAFE WITH WARNINGS"]).toContain(payload.checks?.runs?.[0]?.status);
    const bundled = await readFile(path.join(outputDir, "trace.jsonl"), "utf-8");
    expect(bundled).not.toContain(secret);
  });

  it("refuses traces whose redacted artifact remains unsafe unless --allow-unsafe", async () => {
    const prompt = "raw prompt must remain blocked after share redaction";
    await writeTrace(tmp, "run-bundle-unsafe.jsonl", [
      event("event-a", {
        runId: "run-bundle-unsafe",
        attributes: { prompt },
      }),
    ]);
    const outputDir = path.join(tmp, "bundle-unsafe");

    await bundleCommand("run-bundle-unsafe", { dir: tmp, out: outputDir });
    // v6.7.4-6 / v6.9-6: artifact-unsafe refusal must be nonzero.
    expect(process.exitCode).toBe(1);
    expect(process.exitCode).not.toBe(0);
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

  it("strict bundle removes stack canaries from every derived file and leaves the source bytes", async () => {
    const message = "synthetic-private-sentence-uduak";
    const pathCanary = "/tmp/synthetic-private/uduak-secret.txt";
    const stack = `Error: ${message}\n    at frame (${pathCanary}:1:1)`;
    const tracePath = path.join(tmp, "run-strict-stack.jsonl");
    const source = jsonl(
      event("event-a", {
        runId: "run-strict-stack",
        status: "error",
        error: { message, name: "Error" },
        attributes: {
          errorStack: stack,
          stackTrace: stack,
          cause: { message, stack },
          copies: [{ stack, errorStack: stack, stackTrace: stack }],
          operationId: "tenant-residual-not-a-stack",
        },
      }),
    );
    await writeFile(tracePath, source, "utf-8");
    const before = createHash("sha256").update(source).digest("hex");
    const outputDir = path.join(tmp, "bundle-strict-stack");

    await bundleCommand("run-strict-stack", {
      dir: tmp,
      out: outputDir,
      profile: "strict",
      json: true,
    });

    expect(process.exitCode ?? 0).toBe(0);
    const after = createHash("sha256")
      .update(await readFile(tracePath, "utf-8"))
      .digest("hex");
    expect(after).toBe(before);
    expect(await readFile(tracePath, "utf-8")).toContain(pathCanary);

    const derived = await readTreeText(outputDir);
    expect(derived).not.toContain(message);
    expect(derived).not.toContain(pathCanary);
    expect(derived).toContain("tenant-residual-not-a-stack");
    expect(derived).not.toContain("stackPolicySatisfied");

    const coreKeys = resolveRedactionProfile("strict").extraKeys;
    const redactKeys = createRedactionProfile("strict").extraKeys;
    for (const key of ["stack", "errorStack", "stackTrace"]) {
      expect(coreKeys).toContain(key);
      expect(redactKeys).toContain(key);
    }
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

  it("writes html format with evidence sidecar only", async () => {
    await writeTrace(tmp, "run-bundle-html.jsonl", [
      event("event-a", { runId: "run-bundle-html" }),
    ]);
    const outputDir = path.join(tmp, "html-out");
    await bundleCommand("run-bundle-html", {
      dir: tmp,
      out: outputDir,
      format: "html",
      json: true,
    });
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(path.join(outputDir, "evidence.html"))).toBe(true);
    expect(existsSync(path.join(outputDir, "evidence.json"))).toBe(true);
    expect(existsSync(path.join(outputDir, "metadata.json"))).toBe(false);
  });

  it("writes zip format archive", async () => {
    await writeTrace(tmp, "run-bundle-zipfmt.jsonl", [
      event("event-a", { runId: "run-bundle-zipfmt" }),
    ]);
    const zipPath = path.join(tmp, "out-bundle.zip");
    await bundleCommand("run-bundle-zipfmt", {
      dir: tmp,
      out: zipPath,
      format: "zip",
      json: true,
    });
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(zipPath)).toBe(true);
    const bytes = readFileSync(zipPath);
    expect(bytes.subarray(0, 2).toString("utf8")).toBe("PK");
  });
});

describe.skipIf(!builtCliHasBundleCommand)("built bundle CLI", () => {
  it("includes bundle command in dist", () => {
    expect(builtCliHasBundleCommand).toBe(true);
  });
});
