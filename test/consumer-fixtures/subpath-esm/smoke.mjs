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
import {
  agentInspectJsonlReader,
  detectTraceFormat,
} from "agent-inspect/readers";
import {
  createRunStatusRule,
  runTraceChecks,
} from "agent-inspect/checks";

const functionChecks = [
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
  createRunStatusRule,
  runTraceChecks,
];

const objectChecks = [agentInspectJsonlReader];

if (functionChecks.some((fn) => typeof fn !== "function")) {
  process.exit(1);
}

if (objectChecks.some((value) => typeof value !== "object" || value === null)) {
  process.exit(1);
}

console.log("subpath-esm:ok");
