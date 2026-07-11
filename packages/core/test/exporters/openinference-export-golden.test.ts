import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { exportRunTree, mergeExportDefaults, validateExport } from "../../src/exporters/index.js";
import { persistedInspectEventsToRunTrees } from "../../src/entries/persisted.js";
import { openTrace } from "../../src/entries/readers.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const sourceFixture = path.join(repoRoot, "fixtures/traces-v1.0/manual-basic.jsonl");
const goldenPath = path.join(repoRoot, "fixtures/standards/openinference-export-golden.json");

async function regenerate(): Promise<{ content: string; payload: GoldenPayload }> {
  const read = await openTrace({ type: "file", path: sourceFixture });
  const tree = persistedInspectEventsToRunTrees([...read.events])[0];
  expect(tree).toBeDefined();
  const out = exportRunTree(tree!, mergeExportDefaults({ format: "openinference" }));
  return { content: out.content, payload: JSON.parse(out.content) as GoldenPayload };
}

type GoldenSpan = {
  span_id: string;
  parent_span_id?: string;
  name: string;
  start_time_unix_nano: string;
  end_time_unix_nano?: string;
  attributes: Record<string, unknown>;
  status?: { code: string };
};

type GoldenPayload = {
  format: string;
  compatibility: string;
  trace_id: string;
  spans: GoldenSpan[];
  warnings: string[];
};

/**
 * Export golden for persisted schema 1.0 (#7): the committed fixture is the
 * canonical OpenInference export of fixtures/traces-v1.0/manual-basic.jsonl.
 * Regeneration must be byte-stable so drift in the export path is visible.
 */
describe("OpenInference export golden (schema 1.0)", () => {
  it("regenerated export matches the committed golden exactly", async () => {
    const { payload } = await regenerate();
    const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8")) as GoldenPayload;
    expect(payload).toEqual(golden);
  });

  it("golden passes export validation", () => {
    const content = fs.readFileSync(goldenPath, "utf8");
    const result = validateExport({
      format: "openinference",
      content,
      contentType: "application/json",
      fileExtension: ".openinference.json",
      warnings: [],
    });
    expect(result.ok).toBe(true);
  });

  it("asserts the stable field contract", async () => {
    const { payload } = await regenerate();

    expect(payload.format).toBe("openinference");
    expect(payload.compatibility).toBe("openinference-compatible");
    expect(payload.spans).toHaveLength(4);

    const [run, plan, tool, llm] = payload.spans as [
      GoldenSpan,
      GoldenSpan,
      GoldenSpan,
      GoldenSpan,
    ];

    // Kind mapping: RUN/LOGIC degrade to CHAIN with warnings; TOOL/LLM map 1:1.
    expect(run.attributes["openinference.span.kind"]).toBe("CHAIN");
    expect(plan.attributes["openinference.span.kind"]).toBe("CHAIN");
    expect(tool.attributes["openinference.span.kind"]).toBe("TOOL");
    expect(llm.attributes["openinference.span.kind"]).toBe("LLM");
    expect(payload.warnings.some((w) => w.includes("RUN mapped to CHAIN"))).toBe(true);

    // Parent chain follows the fixture's explicit parent ids.
    expect(run.parent_span_id).toBeUndefined();
    expect(plan.parent_span_id).toBe(run.span_id);
    expect(tool.parent_span_id).toBe(plan.span_id);
    expect(llm.parent_span_id).toBe(tool.span_id);

    // Timestamps are exact decimal strings derived from the fixture's ISO
    // times (2023-11-14T22:13:20Z era), matching the import fixtures' shape.
    for (const span of payload.spans) {
      expect(span.start_time_unix_nano).toMatch(/^\d{19}$/);
    }
    expect(run.start_time_unix_nano).toBe("1700000000000000000");
    expect(tool.end_time_unix_nano).toBe("1700000002500000000");

    // Token usage flows through to OpenInference token-count attributes.
    expect(llm.attributes["llm.model_name"]).toBe("fixture-model");
    expect(llm.attributes["llm.token_count.prompt"]).toBe(10);
    expect(llm.attributes["llm.token_count.completion"]).toBe(5);
  });
});
