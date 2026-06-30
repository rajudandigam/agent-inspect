import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseLogsToTrees } from "../../src/logs/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const mcpLogFixture = path.join(repoRoot, "fixtures/logs/mcp-tool-call-json.log");
const mcpConfigFixture = path.join(
  repoRoot,
  "fixtures/configs/mcp-tool-call-agent-inspect.logs.json",
);

describe("MCP-inspired tool-call log fixture", () => {
  it("parses start, completion, and error metadata without MCP dependencies", async () => {
    const res = await parseLogsToTrees(mcpLogFixture, {
      format: "json",
      configPath: mcpConfigFixture,
    });

    expect(res.warnings).toEqual([]);
    expect(res.events).toHaveLength(6);

    const tree = res.trees.find((t) => t.runId === "mcp_fixture_run_01");
    expect(tree).toBeDefined();
    expect(tree?.metadata.kinds.RUN).toBe(1);
    expect(tree?.metadata.kinds.TOOL).toBe(3);
    expect(tree?.metadata.kinds.ERROR).toBe(1);
    expect(tree?.metadata.kinds.RESULT).toBe(1);
    expect(tree?.metadata.confidenceBreakdown.explicit).toBe(5);

    const started = res.events.find(
      (event) =>
        event.attributes?.callId === "call_search_docs_01" &&
        event.status === "running",
    );
    expect(started?.kind).toBe("TOOL");
    expect(started?.attributes?.type).toBe("tool_call");
    expect(started?.attributes?.source).toBe("synthetic-mcp-fixture");
    expect(started?.confidence).toBe("explicit");
    expect(started?.source.type).toBe("json-log");

    const failed = res.events.find((event) => event.kind === "ERROR");
    expect(failed?.status).toBe("error");
    expect(failed?.attributes?.toolName).toBe("read_file");
    expect(failed?.attributes?.errorCode).toBe("invalid_params");
  });
});
