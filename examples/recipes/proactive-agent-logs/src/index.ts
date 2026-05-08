/**
 * Prints CLI commands to parse bundled JSON / log4js samples (no network).
 */
import path from "node:path";

const root = process.cwd();

console.log("\n=== proactive-agent-logs recipe ===\n");
console.log("Sample lines live next to this package:");
console.log(`  ${path.join(root, "sample-json.log")}`);
console.log(`  ${path.join(root, "sample-log4js.log")}`);
console.log(`  ${path.join(root, "agent-inspect.logs.json")}`);
console.log("\nFrom repository root, run:\n");
console.log(
  "  node packages/cli/dist/index.cjs logs examples/recipes/proactive-agent-logs/sample-json.log --format json --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json",
);
console.log(
  "\n  node packages/cli/dist/index.cjs logs examples/recipes/proactive-agent-logs/sample-log4js.log --format log4js --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json",
);
console.log(
  "\n  node packages/cli/dist/index.cjs tail --file examples/recipes/proactive-agent-logs/sample-json.log --format json --config examples/recipes/proactive-agent-logs/agent-inspect.logs.json --once",
);
console.log("\nExpect: Run …, confidence labels, tool/llm lanes, redacted userUuid/tripUuid prefixes.");
console.log("");
