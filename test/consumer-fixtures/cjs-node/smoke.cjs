const { inspectRun, maybeInspectRun, step } = require("agent-inspect");

if (
  typeof inspectRun !== "function" ||
  typeof step !== "function" ||
  typeof maybeInspectRun !== "function"
) {
  process.exit(1);
}

console.log("cjs-node:ok");
