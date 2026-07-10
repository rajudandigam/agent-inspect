/**
 * Golden-path E2E: broken run → inspect → contract → suite → verify-safe.
 * Run from repo root after build: node scripts/golden-path-e2e.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "packages/cli/dist/index.mjs");
const tmp = mkdtempSync(path.join(os.tmpdir(), "agent-inspect-golden-"));

function run(args) {
  const result = spawnSync("node", [bin, ...args], { cwd: tmp, encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(`agent-inspect ${args.join(" ")} failed`);
  }
  return result.stdout;
}

try {
  if (!existsSync(bin)) throw new Error("CLI not built — run pnpm build first");
  run(["init", "--yes"]);
  const demo = path.join(tmp, "examples", "agent-inspect-demo.mjs");
  spawnSync("node", [demo], { cwd: tmp, stdio: "inherit" });
  const listed = JSON.parse(run(["list", "--dir", ".agent-inspect", "--json"]));
  const runId = listed[0]?.runId ?? listed.runs?.[0]?.runId;
  if (!runId) throw new Error("no run id");
  run(["inspect", runId, "--dir", ".agent-inspect"]);
  run(["verify-safe", runId, "--dir", ".agent-inspect", "--json"]);
  run(["report", runId, "--dir", ".agent-inspect", "--format", "markdown"]);
  console.log("[golden-path-e2e] OK");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
