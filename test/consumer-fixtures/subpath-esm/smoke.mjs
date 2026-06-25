import { parseLogsToTrees } from "agent-inspect/logs";
import { exportMarkdown } from "agent-inspect/exporters";
import { diffTraceEvents } from "agent-inspect/diff";
import { isPersistedInspectEvent } from "agent-inspect/persisted";
import { resolveRedactionProfile } from "agent-inspect/advanced";
import { fileWriter, memoryWriter, nullWriter } from "agent-inspect/writers";

const checks = [
  parseLogsToTrees,
  exportMarkdown,
  diffTraceEvents,
  isPersistedInspectEvent,
  resolveRedactionProfile,
  fileWriter,
  memoryWriter,
  nullWriter,
];

if (checks.some((fn) => typeof fn !== "function")) {
  process.exit(1);
}

console.log("subpath-esm:ok");
