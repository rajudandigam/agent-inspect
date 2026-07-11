import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun } from "agent-inspect";

import { resetMcpToolCallIdsForTests, wrapMcpClient } from "../src/index.js";
import { summarizeMcpValue } from "../src/summarize.js";

/**
 * Adversarial privacy/serialization coverage (#110): hostile or edge-case
 * values must degrade into bounded, redacted summaries without throwing into
 * user code or leaking raw data to disk. Synthetic values only.
 */
describe("summarizeMcpValue adversarial inputs", () => {
  it("degrades values JSON.stringify cannot represent instead of crashing", () => {
    expect(summarizeMcpValue(undefined)).toBe("undefined");
    expect(summarizeMcpValue(() => "x")).toContain("=>");
    expect(summarizeMcpValue(Symbol("secret-tag"))).toBe("Symbol(secret-tag)");
  });

  it("degrades BigInt values via String fallback", () => {
    expect(summarizeMcpValue(BigInt("9007199254740993"))).toBe("9007199254740993");
    expect(summarizeMcpValue({ total: BigInt(7) })).toBe("[object Object]");
  });

  it("degrades cyclic structures without throwing", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic.self = cyclic;
    expect(summarizeMcpValue(cyclic)).toBe("[object Object]");
  });

  it("degrades throwing toJSON serializers without throwing", () => {
    const hostile = {
      toJSON() {
        throw new Error("serializer exploded");
      },
    };
    expect(summarizeMcpValue(hostile)).toBe("[object Object]");
  });

  it("degrades values whose String conversion also throws", () => {
    const doubleHostile = {
      toJSON() {
        throw new Error("no json");
      },
      toString() {
        throw new Error("no string");
      },
    };
    expect(summarizeMcpValue(doubleHostile)).toBe("[unserializable]");
  });

  it("bounds non-ASCII and multibyte payloads to the summary length", () => {
    const emoji = "🛰️".repeat(300);
    const bounded = summarizeMcpValue(emoji, 40);
    expect(bounded.length).toBeLessThanOrEqual(40);
    expect(bounded.endsWith("...")).toBe(true);

    const cjk = summarizeMcpValue({ 質問: "こんにちは世界".repeat(50) }, 64);
    expect(cjk.length).toBeLessThanOrEqual(64);
  });

  it("handles degenerate maxLength values without negative slices", () => {
    expect(summarizeMcpValue("abcdef", 3)).toBe("...");
    expect(summarizeMcpValue("abcdef", 1)).toBe("...");
    expect(summarizeMcpValue("abcdef", 0)).toBe("...");
  });
});

describe("wrapMcpClient adversarial capture", () => {
  let traceDir: string;

  beforeEach(async () => {
    resetMcpToolCallIdsForTests();
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-mcp-adv-"));
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
  });

  afterEach(async () => {
    delete process.env.AGENT_INSPECT_TRACE_DIR;
    await rm(traceDir, { recursive: true, force: true });
  });

  async function readTraceText(): Promise<string> {
    const traceFiles = await readdir(traceDir);
    const traceFile = traceFiles.find((file) => file.endsWith(".jsonl"));
    expect(traceFile).toBeDefined();
    return readFile(path.join(traceDir, traceFile!), "utf-8");
  }

  function fixtureClient() {
    return wrapMcpClient(
      {
        async callTool({ name }: { name: string; arguments?: unknown }) {
          return { content: [{ type: "text", text: `ok:${name}` }] };
        },
      },
      { serverName: "adversarial-fixture" },
    );
  }

  it("cyclic tool arguments do not throw into user code and degrade in the trace", async () => {
    const client = fixtureClient();
    const cyclic: Record<string, unknown> = { query: "loop" };
    cyclic.self = cyclic;

    let result: unknown;
    await inspectRun(
      "mcp-adversarial-cyclic",
      async () => {
        result = await client.callTool({ name: "echo", arguments: cyclic });
      },
      { traceDir, silent: true },
    );

    expect(result).toMatchObject({ content: [{ type: "text", text: "ok:echo" }] });
    const text = await readTraceText();
    expect(text).toContain('"argumentSummary":"[object Object]"');
  });

  it("BigInt and undefined arguments are captured as degraded summaries", async () => {
    const client = fixtureClient();
    await inspectRun(
      "mcp-adversarial-bigint",
      async () => {
        await client.callTool({ name: "count", arguments: { total: BigInt(9) } });
        await client.callTool({ name: "blank", arguments: undefined });
      },
      { traceDir, silent: true },
    );

    const text = await readTraceText();
    expect(text).toContain("mcp:count");
    expect(text).toContain("mcp:blank");
    // undefined arguments fall back to the empty-object summary.
    expect(text).toContain('"argumentSummary":"{}"');
  });

  it("oversized arguments are bounded before they reach disk", async () => {
    const client = fixtureClient();
    const oversized = { blob: "A".repeat(50_000), nested: { pad: "B".repeat(50_000) } };

    await inspectRun(
      "mcp-adversarial-oversized",
      async () => {
        await client.callTool({ name: "upload", arguments: oversized });
      },
      { traceDir, silent: true },
    );

    const text = await readTraceText();
    const line = text
      .split(/\r?\n/)
      .find((row) => row.includes('"toolName":"upload"'));
    expect(line).toBeDefined();
    const parsed = JSON.parse(line!) as {
      metadata?: { argumentSummary?: string };
    };
    expect(parsed.metadata?.argumentSummary?.length).toBeLessThanOrEqual(240);
    expect(text).not.toContain("A".repeat(1000));
  });

  it("sensitive keys in wrapper metadata are redacted before disk", async () => {
    const client = wrapMcpClient(
      {
        async callTool({ name }: { name: string; arguments?: unknown }) {
          return { content: [{ type: "text", text: `ok:${name}` }] };
        },
      },
      {
        serverName: "adversarial-fixture",
        metadata: {
          apiKey: "sk_test_fake_adversarial_key",
          password: "fixture-password-value",
          channel: "fixture-safe-value",
        },
      },
    );

    await inspectRun(
      "mcp-adversarial-redaction",
      async () => {
        await client.callTool({ name: "echo", arguments: { message: "hi" } });
      },
      { traceDir, silent: true },
    );

    const text = await readTraceText();
    expect(text).not.toContain("sk_test_fake_adversarial_key");
    expect(text).not.toContain("fixture-password-value");
    expect(text).toContain("fixture-safe-value");
  });

  it("non-ASCII tool names and arguments survive capture as UTF-8", async () => {
    const client = fixtureClient();
    await inspectRun(
      "mcp-adversarial-unicode",
      async () => {
        await client.callTool({
          name: "翻訳-🌐",
          arguments: { 質問: "¿dónde está la estación?" },
        });
      },
      { traceDir, silent: true },
    );

    const text = await readTraceText();
    expect(text).toContain("mcp:翻訳-🌐");
    expect(text).toContain("dónde");
  });
});
