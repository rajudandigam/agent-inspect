const { parseLogsToTrees } = require("agent-inspect/logs");
const { exportMarkdown } = require("agent-inspect/exporters");
const { diffTraceEvents } = require("agent-inspect/diff");
const { isPersistedInspectEvent } = require("agent-inspect/persisted");
const {
  createInspector,
  createInspectorRuntime,
  resolveRedactionProfile,
} = require("agent-inspect/advanced");
const {
  bufferedFileWriter,
  compositeWriter,
  fileWriter,
  memoryWriter,
  nullWriter,
} = require("agent-inspect/writers");
const {
  agentInspectJsonlReader,
  detectTraceFormat,
} = require("agent-inspect/readers");

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
];

const objectChecks = [agentInspectJsonlReader];

if (functionChecks.some((fn) => typeof fn !== "function")) {
  process.exit(1);
}

if (objectChecks.some((value) => typeof value !== "object" || value === null)) {
  process.exit(1);
}

console.log("subpath-cjs:ok");
