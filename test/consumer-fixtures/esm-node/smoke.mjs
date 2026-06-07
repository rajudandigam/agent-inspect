import { inspectRun, maybeInspectRun, step } from "agent-inspect";

if (
  typeof inspectRun !== "function" ||
  typeof step !== "function" ||
  typeof maybeInspectRun !== "function"
) {
  process.exit(1);
}

console.log("esm-node:ok");
