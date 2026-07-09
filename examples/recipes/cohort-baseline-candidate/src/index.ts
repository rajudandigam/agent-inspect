import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const recipeDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(recipeDir, "../../..");
const fixtureDir = path.join(repoRoot, "fixtures/cohorts/before-after");

const result = spawnSync(
  "node",
  [
    path.join(repoRoot, "packages/cli/dist/index.cjs"),
    "cohort",
    "--dir",
    fixtureDir,
    "--baseline",
    "before",
    "--candidate",
    "after",
    "--group-by",
    "model",
  ],
  {
    cwd: recipeDir,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.status !== 1) {
  console.error("Expected exit code 1 (regression detected)");
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
