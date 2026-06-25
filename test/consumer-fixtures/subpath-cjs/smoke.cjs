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
const { detectTraceFormat } = require("agent-inspect/readers");

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

console.log("subpath-cjs:ok");
