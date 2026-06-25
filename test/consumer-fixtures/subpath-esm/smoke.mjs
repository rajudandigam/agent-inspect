import { parseLogsToTrees } from "agent-inspect/logs";
import { exportMarkdown } from "agent-inspect/exporters";
import { diffTraceEvents } from "agent-inspect/diff";
import { isPersistedInspectEvent } from "agent-inspect/persisted";
import {
  createInspector,
  createInspectorRuntime,
  resolveRedactionProfile,
} from "agent-inspect/advanced";
import {
  bufferedFileWriter,
  compositeWriter,
  fileWriter,
  memoryWriter,
  nullWriter,
} from "agent-inspect/writers";
import { detectTraceFormat } from "agent-inspect/readers";

const checks = [
  parseLogsToTrees,
  exportMarkdown,
  diffTraceEvents,
  isPersistedInspectEvent,
  createInspector,
  createInspectorRuntime,
  resolveRedactionProfile,
  bufferedFileWriter,
  compositeWriter,
  fileWriter,
  memoryWriter,
  nullWriter,
  detectTraceFormat,
];

if (checks.some((fn) => typeof fn !== "function")) {
  process.exit(1);
}

console.log("subpath-esm:ok");
