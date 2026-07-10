/**
 * Record consumer compatibility matrix evidence for pre-v7 stabilization.
 * Run from repo root: node scripts/consumer-compat-matrix.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(
  root,
  "docs/implementation/PRE-V7-ADOPTION-EVIDENCE.md",
);

const matrix = [
  { os: process.platform, node: process.version, module: "ESM", status: "local-smoke" },
  { os: process.platform, node: process.version, module: "CJS", status: "local-smoke" },
];

function run(label, cmd, args, cwd = root) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

try {
  execSync("pnpm run build", { cwd: root, stdio: "pipe" });
  run("pack smoke", "node", ["scripts/package-smoke.mjs"], root);
  matrix[0].status = "pass";
  matrix[1].status = "pass";
} catch (error) {
  matrix[0].status = "fail";
  matrix[1].status = "fail";
  console.error(error);
  process.exit(1);
}

const table = [
  "## Consumer compatibility matrix (v6.5.1)",
  "",
  "| Environment | Node | Module | Status | Date |",
  "|-------------|------|--------|--------|------|",
  ...matrix.map(
    (row) =>
      `| ${row.os} | ${row.node} | ${row.module} | ${row.status} | ${new Date().toISOString().slice(0, 10)} |`,
  ),
  "",
  "_Full cross-platform matrix (Node 20/22/24, Linux/macOS/Windows) runs in CI/release gate._",
  "",
].join("\n");

const existing = readFileSync(outPath, "utf8");
const updated = existing.includes("## Consumer compatibility matrix (v6.5.1)")
  ? existing.replace(/## Consumer compatibility matrix \(v6\.5\.1\)[\s\S]*?(?=\n## |$)/, table)
  : `${existing.trim()}\n\n${table}\n`;

writeFileSync(outPath, updated);
console.log(`[consumer-compat-matrix] OK: updated ${outPath}`);
