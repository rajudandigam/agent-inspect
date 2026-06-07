/**
 * Downstream compatibility smoke: ESM/CJS consumers, Jest-style CJS, ts-jest Node16, CLI help.
 * Run from repo root: pnpm compat:smoke
 *
 * Builds first, packs a tarball, installs into temp consumer dirs, runs test/consumer-fixtures/.
 * Set AGENT_INSPECT_KEEP_SMOKE_DIR=true to preserve temp dirs for debugging.
 */
import { execSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesRoot = path.join(root, "test", "consumer-fixtures");
const keep = process.env.AGENT_INSPECT_KEEP_SMOKE_DIR === "true";
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

function fail(label, detail) {
  console.error(`[compat:smoke] ${label}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function run(label, cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (result.status !== 0) {
    fail(label, `${result.stdout || ""}\n${result.stderr || ""}`.trim());
  }
  return result;
}

function parsePackedFilename(output) {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed[0]?.filename;
      if (typeof parsed === "object" && parsed && "filename" in parsed) {
        return parsed.filename;
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1);
}

function assertCliHelp(label, stdout, stderr, status, needles) {
  const combined = `${stdout}\n${stderr}`;
  if (status !== 0 && status != null) {
    fail(label, combined);
  }
  for (const needle of needles) {
    if (!combined.includes(needle)) {
      fail(`${label}: missing "${needle}"`, combined);
    }
  }
}

function installFixture(fixtureName, installDir, tgzPath) {
  const src = path.join(fixturesRoot, fixtureName);
  if (!existsSync(src)) {
    fail(`missing fixture: ${fixtureName}`);
  }
  mkdirSync(installDir, { recursive: true });
  cpSync(src, installDir, { recursive: true });
  execSync(`npm install "${tgzPath}"`, {
    cwd: installDir,
    stdio: "inherit",
    encoding: "utf8",
  });
}

process.chdir(root);

console.log("[compat:smoke] building packages…");
execSync("pnpm run build", { stdio: "inherit", encoding: "utf8" });

const coreCjs = path.join(root, "packages", "core", "dist", "index.cjs");
if (!existsSync(coreCjs)) {
  fail("missing packages/core/dist/index.cjs after build");
}
const coreSrc = await import("node:fs/promises").then((fs) => fs.readFile(coreCjs, "utf8"));
if (coreSrc.includes('require("chalk")') || coreSrc.includes("require('chalk')")) {
  fail("core CJS still externalizes chalk — bundle via tsup noExternal");
}
if (coreSrc.includes('require("nanoid")') || coreSrc.includes("require('nanoid')")) {
  fail("core CJS still externalizes nanoid — bundle via tsup noExternal");
}

const cliBin = path.join(root, "packages", "cli", "dist", "index.cjs");
const cliChecks = [
  [["--help"], ["agent-inspect", "list", "view", "logs", "export", "diff"]],
  [["list", "--help"], ["list", "agent-inspect"]],
  [["view", "--help"], ["view"]],
  [["logs", "--help"], ["logs"]],
  [["export", "--help"], ["export"]],
  [["diff", "--help"], ["diff"]],
];
for (const [args, needles] of cliChecks) {
  const help = spawnSync(process.execPath, [cliBin, ...args], { encoding: "utf8" });
  assertCliHelp(
    `node packages/cli/dist/index.cjs ${args.join(" ")}`,
    help.stdout,
    help.stderr,
    help.status,
    needles,
  );
}

const packProc = spawnSync("npm", ["pack", "--silent", "--ignore-scripts"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    npm_config_json: "false",
    NPM_CONFIG_JSON: "false",
  },
});
const packOut = `${packProc.stdout || ""}\n${packProc.stderr || ""}`.trim();
const tgzName = parsePackedFilename(packOut);
if (!tgzName || !tgzName.endsWith(".tgz")) {
  fail("could not parse .tgz from npm pack", packOut);
}
const tgzPath = path.join(root, tgzName);
if (!existsSync(tgzPath)) {
  fail("tarball missing", tgzPath);
}

const tmpRoot = path.join(
  os.tmpdir(),
  `agent-inspect-compat-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);
mkdirSync(tmpRoot, { recursive: true });

try {
  const esmDir = path.join(tmpRoot, "esm-node");
  installFixture("esm-node", esmDir, tgzPath);
  run("esm-node", process.execPath, ["smoke.mjs"], { cwd: esmDir });

  const cjsDir = path.join(tmpRoot, "cjs-node");
  installFixture("cjs-node", cjsDir, tgzPath);
  run("cjs-node", process.execPath, ["smoke.cjs"], { cwd: cjsDir });

  const jestDir = path.join(tmpRoot, "jest-cjs");
  installFixture("jest-cjs", jestDir, tgzPath);
  run("jest-cjs", process.execPath, ["smoke.test.cjs"], { cwd: jestDir });

  const tsDir = path.join(tmpRoot, "ts-jest-node16");
  installFixture("ts-jest-node16", tsDir, tgzPath);
  run("ts-jest-node16", process.execPath, ["run-smoke.cjs"], {
    cwd: tsDir,
    env: { ...process.env, AGENT_INSPECT_TSC_BIN: tscBin },
  });

  const binDir = path.join(tmpRoot, "cli-bin");
  mkdirSync(binDir, { recursive: true });
  writeFileSync(
    path.join(binDir, "package.json"),
    `${JSON.stringify({ name: "cli-bin-smoke", private: true, type: "module" }, null, 2)}\n`,
  );
  execSync(`npm install "${tgzPath}"`, { cwd: binDir, stdio: "inherit", encoding: "utf8" });
  const binPath = path.join(binDir, "node_modules", ".bin", "agent-inspect");
  if (!existsSync(binPath)) {
    fail("missing node_modules/.bin/agent-inspect after install");
  }
  const binHelp = spawnSync(binPath, ["--help"], { cwd: binDir, encoding: "utf8" });
  assertCliHelp("agent-inspect --help", binHelp.stdout, binHelp.stderr, binHelp.status, [
    "agent-inspect",
    "list",
    "view",
    "logs",
    "export",
    "diff",
  ]);

  const jestPkg = path.join(root, "node_modules", "jest", "package.json");
  if (existsSync(jestPkg)) {
    console.log("[compat:smoke] jest detected — optional full runner smoke not implemented yet");
  } else {
    console.log(
      "[compat:smoke] jest not installed — Jest-style CJS smoke ran via smoke.test.cjs (see test/consumer-fixtures/jest-cjs/README.md)",
    );
  }

  console.log(
    "[compat:smoke] OK: bundled CJS, ESM/CJS consumers, jest-cjs pattern, ts-jest Node16 compile, CLI help",
  );
} finally {
  if (!keep) {
    rmSync(tmpRoot, { recursive: true, force: true });
    rmSync(tgzPath, { force: true });
  } else {
    console.log("[compat:smoke] kept:", tmpRoot, tgzPath);
  }
}
