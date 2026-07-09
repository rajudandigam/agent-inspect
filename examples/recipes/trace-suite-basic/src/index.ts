import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const recipeDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(recipeDir, "../../..");
const configPath = path.join(repoRoot, "fixtures/configs/outcome-suite.suite.json");

const result = spawnSync(
  "node",
  [
    path.join(repoRoot, "packages/cli/dist/index.js"),
    "suite",
    "run",
    "--config",
    configPath,
  ],
  {
    cwd: recipeDir,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
