import { describe, expect, it } from "vitest";

import type { TraceEvent } from "../../src/types.js";

import {
  exportRunTree,
  validateExport,
  validateExportContent,
} from "../../src/exporters/index.js";
import { manualTraceEventsToRunTree } from "../../src/exporters/manual-trace-adapter.js";

function tiny(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_ix",
      name: "ix",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 2,
      runId: "run_ix",
      status: "success",
      endTime: 2,
      durationMs: 1,
    },
  ];
}

describe("exporters/index", () => {
  it("exportRunTree dispatches formats", () => {
    const tree = manualTraceEventsToRunTree(tiny());
    expect(exportRunTree(tree, { format: "markdown" }).format).toBe("markdown");
    expect(exportRunTree(tree, { format: "html" }).format).toBe("html");
    expect(exportRunTree(tree, { format: "openinference" }).format).toBe("openinference");
    expect(exportRunTree(tree, { format: "otlp-json" }).format).toBe("otlp-json");
  });

  it("defaults include metadata section for markdown", () => {
    const tree = manualTraceEventsToRunTree(tiny());
    const r = exportRunTree(tree, { format: "markdown" });
    expect(r.content).toContain("Summary");
  });

  it("validateExport merges warnings", () => {
    const tree = manualTraceEventsToRunTree(tiny());
    const r = exportRunTree(tree, { format: "markdown" });
    const v = validateExport(r);
    expect(v.format).toBe("markdown");
    expect(Array.isArray(v.warnings)).toBe(true);
  });

  it("validateExportContent standalone", () => {
    expect(validateExportContent("markdown", "# AgentInspect Run: z").ok).toBe(true);
  });
});
