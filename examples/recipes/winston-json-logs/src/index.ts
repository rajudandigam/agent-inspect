/**
 * Prints CLI commands for bundled Winston JSON lines (no network, no winston dependency).
 */
import path from "node:path";

const root = process.cwd();

console.log("\n=== winston-json-logs recipe ===\n");
console.log("Bundled deterministic Winston-shaped JSON lines:");
console.log(`  ${path.join(root, "sample-winston.log")}`);
console.log(`  ${path.join(root, "agent-inspect.logs.json")}`);
console.log("\nFrom repository root, run:\n");
console.log(
  "  node packages/cli/dist/index.cjs logs examples/recipes/winston-json-logs/sample-winston.log --format json --config examples/recipes/winston-json-logs/agent-inspect.logs.json",
);
console.log(
  "\n  node packages/cli/dist/index.cjs tail --file examples/recipes/winston-json-logs/sample-winston.log --format json --config examples/recipes/winston-json-logs/agent-inspect.logs.json --once",
);
console.log("\nExpect: Run winston_run_01, tool/llm lanes, confidence labels.");
console.log("");
