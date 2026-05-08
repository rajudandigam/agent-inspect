import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseLogsToTrees } from "../../src/logs/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("tree builder (pre-v1.0 conformance)", () => {
  it("builds at least one run tree from proactive JSON fixture", async () => {
    const logPath = path.join(repoRoot, "fixtures/logs/proactive-json.log");
    const cfgPath = path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json");
    const result = await parseLogsToTrees(logPath, { format: "json", configPath: cfgPath });
    expect(result.trees.length).toBeGreaterThanOrEqual(1);
    expect(result.events.length).toBeGreaterThan(0);
    const tree = result.trees[0]!;
    expect(tree.metadata.totalEvents).toBeGreaterThan(0);
    expect(tree.metadata.confidenceBreakdown.explicit + tree.metadata.confidenceBreakdown.correlated).toBeGreaterThan(
      0,
    );
  });
});
