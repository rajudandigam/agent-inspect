/**
 * Install the packed tarball into a temp dir and verify ESM import + local bin CLI.
 * Uses only Node built-ins. Run from repo root: pnpm run pack:smoke
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.env.AGENT_INSPECT_KEEP_SMOKE_DIR === "true";

function assertHelp(label, stdout, stderr, status) {
  const combined = `${stdout}\n${stderr}`;
  if (status !== 0 && status != null) {
    console.error(`[pack:smoke] ${label} exit ${status}\n${combined}`);
    process.exit(1);
  }
  // Core CLI commands shipped in the main tarball (no LangChain).
  for (const needle of [
    "agent-inspect",
    "list",
    "view",
    "clean",
    "logs",
    "tail",
    "export",
    "diff",
  ]) {
    if (!combined.includes(needle)) {
      console.error(
        `[pack:smoke] ${label}: expected stdout to contain "${needle}"\n${combined}`,
      );
      process.exit(1);
    }
  }
}

process.chdir(root);

function parsePackedFilename(output) {
  const trimmed = output.trim();
  if (!trimmed) return undefined;

  // Some environments set npm_config_json=true which makes npm commands emit JSON.
  // Prefer parsing JSON when it looks like JSON.
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed[0]?.filename;
      if (typeof parsed === "object" && parsed && "filename" in parsed) {
        return parsed.filename;
      }
    } catch {
      // Fall through to line parsing.
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1);
}

// Force non-JSON output so we can reliably read the .tgz filename even when
// the environment sets npm_config_json=true (common in CI/release tooling).
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
  console.error("[pack:smoke] could not parse .tgz name from npm pack:\n", packOut);
  process.exit(1);
}

const tgzPath = path.join(root, tgzName);
if (!existsSync(tgzPath)) {
  console.error("[pack:smoke] tarball missing:", tgzPath);
  process.exit(1);
}

const tmpRoot = path.join(
  os.tmpdir(),
  `agent-inspect-pack-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);
mkdirSync(tmpRoot, { recursive: true });

try {
  writeFileSync(
    path.join(tmpRoot, "package.json"),
    `${JSON.stringify({ name: "agent-inspect-smoke", private: true, type: "module" }, null, 2)}\n`,
  );

  execSync(`npm install "${tgzPath}"`, {
    cwd: tmpRoot,
    stdio: "inherit",
    encoding: "utf8",
  });

  const esm = spawnSync(
    process.execPath,
    [
      "-e",
      "import('agent-inspect').then(m => { if (!m.inspectRun || !m.step || !m.maybeInspectRun || !m.observe) process.exit(1); })",
    ],
    { cwd: tmpRoot, encoding: "utf8" },
  );
  if (esm.status !== 0) {
    console.error("[pack:smoke] ESM import check failed:\n", esm.stderr || esm.stdout);
    process.exit(1);
  }

  const cjsDir = path.join(tmpRoot, "cjs-check");
  mkdirSync(cjsDir, { recursive: true });
  writeFileSync(
    path.join(cjsDir, "package.json"),
    `${JSON.stringify({ name: "agent-inspect-cjs-smoke", private: true, type: "commonjs" }, null, 2)}\n`,
  );
  const cjs = spawnSync(
    process.execPath,
    [
      "-e",
      "const m = require('agent-inspect'); if (!m.inspectRun || !m.step || !m.maybeInspectRun || !m.observe) process.exit(1);",
    ],
    { cwd: cjsDir, encoding: "utf8" },
  );
  if (cjs.status !== 0) {
    console.error("[pack:smoke] CJS require check failed:\n", cjs.stderr || cjs.stdout);
    process.exit(1);
  }

  const binPath = path.join(tmpRoot, "node_modules", ".bin", "agent-inspect");
  if (!existsSync(binPath)) {
    console.error("[pack:smoke] missing node_modules/.bin/agent-inspect");
    process.exit(1);
  }

  const binHelp = spawnSync(binPath, ["--help"], {
    cwd: tmpRoot,
    encoding: "utf8",
  });
  assertHelp("./node_modules/.bin/agent-inspect --help", binHelp.stdout, binHelp.stderr, binHelp.status);

  const npmExec = spawnSync("npm", ["exec", "--", "agent-inspect", "--help"], {
    cwd: tmpRoot,
    encoding: "utf8",
    shell: true,
  });
  assertHelp("npm exec -- agent-inspect --help", npmExec.stdout, npmExec.stderr, npmExec.status);

  const npxNoInstall = spawnSync("npx", ["--no-install", "agent-inspect", "--help"], {
    cwd: tmpRoot,
    encoding: "utf8",
    shell: true,
  });
  assertHelp("npx --no-install agent-inspect --help", npxNoInstall.stdout, npxNoInstall.stderr, npxNoInstall.status);

  console.log(
    "[pack:smoke] OK: tarball install, ESM import, CJS require, and local bin / npm exec / npx --no-install --help",
  );
} finally {
  if (!keep) {
    rmSync(tmpRoot, { recursive: true, force: true });
    rmSync(tgzPath, { force: true });
  } else {
    console.log("[pack:smoke] kept:", tmpRoot, tgzPath);
  }
}
