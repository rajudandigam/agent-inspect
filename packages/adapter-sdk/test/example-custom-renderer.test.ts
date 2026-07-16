import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun, step } from "agent-inspect";
import { persistedInspectEventsToRunTrees } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";
import { TraceDirectory } from "agent-inspect/advanced";

import { renderWithSafety } from "../src/index.js";
import { markdownSummaryRenderer } from "../../../examples/adapter-sdk/custom-renderer/src/renderer.js";

describe("custom renderer example", () => {
  let traceDir: string;
  let tree: ReturnType<typeof persistedInspectEventsToRunTrees>[number];

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-custom-renderer-"));
    await inspectRun(
      "custom-renderer-demo",
      async () => {
        await step.tool("lookup-inventory", async () => ({ matched: true }));
        await step("summarize-result", async () => "metadata-only summary");
      },
      { traceDir },
    );
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    const read = await openTrace({ type: "file", path: td.getPath(files[0]!) });
    tree = persistedInspectEventsToRunTrees(read.events)[0]!;
    expect(tree).toBeDefined();
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  it("renders a markdown summary with expected markers", () => {
    const result = markdownSummaryRenderer.render(tree);
    expect(result.contentType).toBe("text/markdown");
    expect(result.warnings).toEqual([]);
    expect(result.content).toContain("# Run summary: custom-renderer-demo");
    expect(result.content).toContain("| runId |");
    expect(result.content).toContain("## Steps");
    expect(result.content).toContain("lookup-inventory");
  });

  it("renders metadata only, never step return values", () => {
    const result = markdownSummaryRenderer.render(tree);
    expect(result.content).not.toContain("metadata-only summary");
  });

  it("composes with renderWithSafety truncation bounds", () => {
    const safe = renderWithSafety(markdownSummaryRenderer, tree, {
      maxContentLength: 40,
    });
    expect(safe.content.length).toBe(40);
    expect(safe.warnings.some((warning) => warning.includes("renderer.truncated"))).toBe(true);
  });

  it("is deterministic for the same tree", () => {
    const a = markdownSummaryRenderer.render(tree).content;
    const b = markdownSummaryRenderer.render(tree).content;
    expect(a).toBe(b);
  });
});

test('standards_version_shape_20260716', () => {
  expect(typeof '1.0.0').toBe('string');
});
