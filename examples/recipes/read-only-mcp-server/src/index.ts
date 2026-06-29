import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { callReadOnlyTool, createMcpServerContext, READ_ONLY_TOOLS } from "@agent-inspect/mcp-server";
import { inspectRun } from "agent-inspect";

const traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-mcp-recipe-"));

await inspectRun("mcp-recipe-run", async () => {}, { traceDir });

const context = createMcpServerContext({ traceDir, redactionProfile: "share" });

console.log(
  JSON.stringify(
    {
      tools: READ_ONLY_TOOLS.map((tool) => tool.name),
      list: JSON.parse((await callReadOnlyTool(context, "list_traces", {})).content[0]!.text as string),
    },
    null,
    2,
  ),
);
