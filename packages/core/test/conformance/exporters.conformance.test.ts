import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { exportRunTree, mergeExportDefaults, validateExport } from "../../src/exporters/index.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("exporters (pre-v1.0 conformance)", () => {
  it("markdown / html / openinference / otlp-json validate from fixture-derived tree", () => {
    const raw = fs.readFileSync(path.join(repoRoot, "fixtures/traces/nested-3-levels.jsonl"), "utf8");
    const events = raw
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l));
    const tree = manualTraceEventsToRunTree(events);

    const md = exportRunTree(tree, mergeExportDefaults({ format: "markdown" }));
    expect(validateExport(md).ok).toBe(true);

    const html = exportRunTree(tree, mergeExportDefaults({ format: "html" }));
    expect(validateExport(html).ok).toBe(true);
    expect(html.content.toLowerCase()).not.toContain("<script");

    const oi = exportRunTree(tree, mergeExportDefaults({ format: "openinference" }));
    expect(validateExport(oi).ok).toBe(true);

    const otlp = exportRunTree(tree, mergeExportDefaults({ format: "otlp-json" }));
    expect(validateExport(otlp).ok).toBe(true);
  });
});
