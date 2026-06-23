const { parseLogsToTrees } = require("agent-inspect/logs");
const { exportMarkdown } = require("agent-inspect/exporters");
const { diffTraceEvents } = require("agent-inspect/diff");
const { isPersistedInspectEvent } = require("agent-inspect/persisted");
const { resolveRedactionProfile } = require("agent-inspect/advanced");

const checks = [
  parseLogsToTrees,
  exportMarkdown,
  diffTraceEvents,
  isPersistedInspectEvent,
  resolveRedactionProfile,
];

if (checks.some((fn) => typeof fn !== "function")) {
  process.exit(1);
}

console.log("subpath-cjs:ok");
