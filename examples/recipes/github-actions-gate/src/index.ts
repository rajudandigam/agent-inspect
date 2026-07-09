import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const recipeDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(recipeDir, "../../..");
const suitePath = path.join(repoRoot, "fixtures/configs/outcome-suite.suite.json");
const outputDir = path.join(recipeDir, ".agent-inspect/gate-artifacts");

const result = spawnSync(
  "node",
  [
    path.join(repoRoot, "packages/cli/dist/index.cjs"),
    "gate",
    "--suite",
    suitePath,
    "--output",
    outputDir,
  ],
  {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
