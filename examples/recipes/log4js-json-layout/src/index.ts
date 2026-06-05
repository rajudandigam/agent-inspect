/**
 * Prints CLI commands for log4js-style lines with embedded JSON (no log4js dependency).
 */
import path from "node:path";

const root = process.cwd();

console.log("\n=== log4js-json-layout recipe ===\n");
console.log("Bundled log4js text lines with trailing JSON objects:");
console.log(`  ${path.join(root, "sample-log4js.log")}`);
console.log(`  ${path.join(root, "agent-inspect.logs.json")}`);
console.log("\nFrom repository root, run:\n");
console.log(
  "  node packages/cli/dist/index.cjs logs examples/recipes/log4js-json-layout/sample-log4js.log --format log4js --config examples/recipes/log4js-json-layout/agent-inspect.logs.json",
);
console.log(
  "\n  node packages/cli/dist/index.cjs tail --file examples/recipes/log4js-json-layout/sample-log4js.log --format log4js --config examples/recipes/log4js-json-layout/agent-inspect.logs.json --once",
);
console.log("\nExpect: Run log4js_run_01, embedded JSON parsed best-effort.");
console.log("");
