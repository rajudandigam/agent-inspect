import path from "node:path";

import { describe, expect, it } from "vitest";

import { defineTraceContract, evaluateTraceContract } from "../../src/checks/contract.js";
import { openTrace } from "../../src/entries/readers.js";

describe("trace contract", () => {
  it("evaluates run duration and tool requirements", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const tracePath = path.join(repoRoot, "fixtures/traces/tool-with-io.jsonl");
    const read = await openTrace({ type: "file", path: tracePath });
    const contract = defineTraceContract({
      run: { requireCompleted: true, maxDurationMs: 600_000 },
      tools: { maxCalls: 10 },
    });
    const result = evaluateTraceContract({ read }, contract);
    expect(result.findings.every((finding) => finding.evidence.length > 0 || finding.status !== "fail")).toBe(
      true,
    );
    expect(result.status).toBeDefined();
  });
});
