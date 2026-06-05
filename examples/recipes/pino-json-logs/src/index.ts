/**
 * Prints CLI commands for bundled pino JSON lines (no network, no pino dependency).
 */
import path from "node:path";

const root = process.cwd();

console.log("\n=== pino-json-logs recipe ===\n");
console.log("Bundled deterministic pino-shaped JSON lines:");
console.log(`  ${path.join(root, "sample-pino.log")}`);
console.log(`  ${path.join(root, "agent-inspect.logs.json")}`);
console.log("\nFrom repository root, run:\n");
console.log(
  "  node packages/cli/dist/index.cjs logs examples/recipes/pino-json-logs/sample-pino.log --format json --config examples/recipes/pino-json-logs/agent-inspect.logs.json",
);
console.log(
  "\n  node packages/cli/dist/index.cjs tail --file examples/recipes/pino-json-logs/sample-pino.log --format json --config examples/recipes/pino-json-logs/agent-inspect.logs.json --once",
);
console.log("\nExpect: Run pino_run_01, tool/llm lanes, confidence labels.");
console.log("");
