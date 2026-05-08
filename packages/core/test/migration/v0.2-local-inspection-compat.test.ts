import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../../src/trace-metadata.js";
import { isAgentInspectTrace } from "../../src/trace-verification.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("v0.2 local inspection compatibility", () => {
  it("extractMetadata works on fixture traces", async () => {
    const filePath = path.join(repoRoot, "fixtures/traces/minimal-success.jsonl");
    const meta = await extractMetadata(filePath);
    expect(meta.runId).toBe("minimal-success");
    expect(meta.status).not.toBe("unknown");
  });

  it("clean verification recognizes valid AgentInspect traces", async () => {
    const ok = await isAgentInspectTrace(path.join(repoRoot, "fixtures/traces/minimal-success.jsonl"));
    expect(ok).toBe(true);
  });

  it("clean verification rejects arbitrary JSONL", async () => {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ai-verify-")), "x.jsonl");
    fs.writeFileSync(tmp, '{"hello":"world"}\n', "utf8");
    const ok = await isAgentInspectTrace(tmp);
    expect(ok).toBe(false);
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  });
});
