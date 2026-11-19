/**
 * Shared helpers for C0P release-artifact pack / inventory / qualify / publish.
 * Node built-ins only. Used by scripts/release-artifacts.mjs and tests.
 */
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Fixed publishable set from .changeset/config.json (must stay 18). */
export function expectedPublishableNames() {
  const config = JSON.parse(
    readFileSync(path.join(root, ".changeset", "config.json"), "utf8"),
  );
  const names = config.fixed?.[0];
  if (!Array.isArray(names) || names.length !== 18) {
    throw new Error(
      `expected .changeset/config.json fixed[0] to list 18 packages, got ${names?.length ?? 0}`,
    );
  }
  return names.slice();
}

export function packageDirForName(name) {
  if (name === "agent-inspect") return root;
  const short = name.replace(/^@agent-inspect\//, "");
  const dir = path.join(root, "packages", short);
  if (!existsSync(path.join(dir, "package.json"))) {
    throw new Error(`missing package directory for ${name}: ${dir}`);
  }
  return dir;
}

export function readPackageManifest(dir) {
  return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

export function gitHeadSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return process.env.GITHUB_SHA || "unknown";
  }
}

function run(label, command, args, opts = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: opts.cwd ?? root,
    env: opts.env ?? process.env,
    stdio: opts.stdio ?? ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const detail = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    throw new Error(`${label} failed (exit ${result.status}): ${detail}`);
  }
  return result;
}

export function parsePackedFilename(packOut) {
  const lines = packOut
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    // Prefer an absolute existing path (pnpm "Tarball Details" line).
    const candidate = line.replace(/^.*\s/, "");
    if (candidate.endsWith(".tgz") && path.isAbsolute(candidate) && existsSync(candidate)) {
      return candidate;
    }
    if (line.endsWith(".tgz") && path.isAbsolute(line) && existsSync(line)) {
      return line;
    }
  }
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line.endsWith(".tgz")) {
      return path.basename(line.replace(/^.*\s/, ""));
    }
  }
  return null;
}

/** Collect string path targets from package.json exports/main/module/types/bin. */
export function collectEntryTargets(manifest) {
  const targets = new Set();

  function add(value) {
    if (typeof value !== "string") return;
    if (value.startsWith("./")) targets.add(value.slice(2));
    else if (!value.startsWith(".") && !value.includes("*")) targets.add(value);
  }

  function walkExports(node) {
    if (node == null) return;
    if (typeof node === "string") {
      add(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walkExports(item);
      return;
    }
    if (typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (key === "default" || key === "import" || key === "require" || key === "types" || key === "node" || key === "browser") {
          walkExports(value);
        } else if (key.startsWith(".")) {
          walkExports(value);
        } else {
          walkExports(value);
        }
      }
    }
  }

  add(manifest.main);
  add(manifest.module);
  add(manifest.types);
  add(manifest.typings);
  walkExports(manifest.exports);
  if (manifest.bin) {
    if (typeof manifest.bin === "string") add(manifest.bin);
    else for (const value of Object.values(manifest.bin)) add(value);
  }
  return [...targets].filter((t) => !t.includes("*"));
}

export function listTarballPaths(tgzPath) {
  const out = execFileSync("tar", ["-tzf", tgzPath], { encoding: "utf8" });
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//, ""));
}

/**
 * Fail closed if advertised entry targets are missing or the archive looks like
 * a three-file README/package/LICENSE stub.
 */
export function assertTarballComplete(name, tgzPath, manifest) {
  const entries = listTarballPaths(tgzPath);
  const entrySet = new Set(entries);
  if (entries.length <= 3) {
    throw new Error(
      `${name}: tarball looks empty/stub (${entries.length} files: ${entries.join(", ")})`,
    );
  }
  const targets = collectEntryTargets(manifest);
  if (targets.length === 0) {
    throw new Error(`${name}: no entry targets derived from package.json`);
  }
  const missing = targets.filter((t) => !entrySet.has(t));
  if (missing.length > 0) {
    throw new Error(
      `${name}: missing advertised entry path(s) in tarball: ${missing.join(", ")}`,
    );
  }
  return { entries, targets };
}

export function packOnePackage(name, outDir) {
  const absOut = path.resolve(outDir);
  mkdirSync(absOut, { recursive: true });
  const dir = packageDirForName(name);
  const manifest = readPackageManifest(dir);
  if (manifest.name !== name) {
    throw new Error(`${name}: directory manifest name is ${manifest.name}`);
  }
  // pack-destination must be absolute: pnpm resolves it relative to --dir.
  const result = run(`${name} pnpm pack`, "pnpm", ["--dir", dir, "pack", "--pack-destination", absOut], {
    env: {
      ...process.env,
      npm_config_json: "false",
      NPM_CONFIG_JSON: "false",
      // Do not re-run monorepo build from root prepack while packing siblings.
      AGENT_INSPECT_SKIP_PREPACK_BUILD: "1",
    },
  });
  const packOut = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const parsed = parsePackedFilename(packOut);
  if (!parsed) {
    throw new Error(`${name}: could not parse packed filename from:\n${packOut}`);
  }
  let tgzPath = path.isAbsolute(parsed) ? parsed : path.join(absOut, parsed);
  if (!existsSync(tgzPath)) {
    const matches = readdirSync(absOut).filter((f) => f.endsWith(".tgz"));
    throw new Error(
      `${name}: packed tarball missing at ${tgzPath} (outDir tgz: ${matches.join(", ") || "none"})\n${packOut}`,
    );
  }
  const finalName = path.basename(tgzPath);
  const finalPath = path.join(absOut, finalName);
  if (path.resolve(tgzPath) !== path.resolve(finalPath)) {
    writeFileSync(finalPath, readFileSync(tgzPath));
    tgzPath = finalPath;
  }
  const { entries, targets } = assertTarballComplete(name, tgzPath, manifest);
  return {
    name,
    version: manifest.version,
    tarball: path.basename(tgzPath),
    sha256: sha256File(tgzPath),
    fileCount: entries.length,
    entryTargets: targets,
    bytes: statSync(tgzPath).size,
  };
}

/**
 * Pack all 18 packages sequentially into artifactsDir and write inventory.json.
 * Caller must have already run a successful monorepo build.
 */
export function packAllPublishable({
  artifactsDir = path.join(root, "release-artifacts"),
  sourceSha = gitHeadSha(),
  runId = process.env.GITHUB_RUN_ID || null,
} = {}) {
  const names = expectedPublishableNames();
  rmSync(artifactsDir, { recursive: true, force: true });
  mkdirSync(artifactsDir, { recursive: true });

  const rootManifest = readPackageManifest(root);
  const expectedVersion = rootManifest.version;
  const packages = [];

  for (const name of names) {
    const record = packOnePackage(name, artifactsDir);
    if (record.version !== expectedVersion) {
      throw new Error(
        `${name}: version ${record.version} does not match root ${expectedVersion}`,
      );
    }
    packages.push(record);
  }

  const seen = new Set();
  for (const pkg of packages) {
    if (seen.has(pkg.name)) {
      throw new Error(`duplicate package in inventory: ${pkg.name}`);
    }
    seen.add(pkg.name);
  }
  for (const name of names) {
    if (!seen.has(name)) {
      throw new Error(`inventory missing expected package: ${name}`);
    }
  }

  const inventory = {
    schemaVersion: 1,
    sourceSha,
    runId,
    expectedVersion,
    packageCount: packages.length,
    expectedNames: names,
    packages,
    createdAt: new Date().toISOString(),
  };
  const inventoryPath = path.join(artifactsDir, "inventory.json");
  writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
  return { artifactsDir, inventoryPath, inventory };
}

export function loadInventory(artifactsDir) {
  const inventoryPath = path.join(artifactsDir, "inventory.json");
  if (!existsSync(inventoryPath)) {
    throw new Error(`missing inventory.json in ${artifactsDir}`);
  }
  return JSON.parse(readFileSync(inventoryPath, "utf8"));
}

/**
 * Re-validate inventory against on-disk tarballs (hash / set / entry targets).
 */
export function validateInventory(artifactsDir, { expectedSourceSha } = {}) {
  const inventory = loadInventory(artifactsDir);
  const expected = expectedPublishableNames();
  if (inventory.packageCount !== 18 || inventory.packages?.length !== 18) {
    throw new Error(
      `inventory packageCount must be 18, got ${inventory.packageCount}/${inventory.packages?.length}`,
    );
  }
  if (JSON.stringify(inventory.expectedNames) !== JSON.stringify(expected)) {
    throw new Error("inventory.expectedNames does not match changeset fixed set");
  }
  if (expectedSourceSha && inventory.sourceSha !== expectedSourceSha) {
    throw new Error(
      `inventory sourceSha mismatch: ${inventory.sourceSha} !== ${expectedSourceSha}`,
    );
  }

  const seen = new Set();
  for (const pkg of inventory.packages) {
    if (seen.has(pkg.name)) throw new Error(`duplicate inventory entry: ${pkg.name}`);
    seen.add(pkg.name);
    if (!expected.includes(pkg.name)) {
      throw new Error(`unexpected package in inventory: ${pkg.name}`);
    }
    if (pkg.version !== inventory.expectedVersion) {
      throw new Error(
        `${pkg.name}: version ${pkg.version} !== inventory ${inventory.expectedVersion}`,
      );
    }
    const tgzPath = path.join(artifactsDir, pkg.tarball);
    if (!existsSync(tgzPath)) {
      throw new Error(`${pkg.name}: missing tarball ${pkg.tarball}`);
    }
    const actual = sha256File(tgzPath);
    if (actual !== pkg.sha256) {
      throw new Error(
        `${pkg.name}: sha256 mismatch (inventory ${pkg.sha256}, disk ${actual})`,
      );
    }
    const dir = packageDirForName(pkg.name);
    // Prefer packed package.json inside the tarball for entry checks.
    const tmp = path.join(os.tmpdir(), `ai-inv-${process.pid}-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
    try {
      execFileSync("tar", ["-xzf", tgzPath, "-C", tmp], { stdio: "ignore" });
      const packedManifest = JSON.parse(
        readFileSync(path.join(tmp, "package", "package.json"), "utf8"),
      );
      assertTarballComplete(pkg.name, tgzPath, packedManifest);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
    // Silence unused dir warning for API stability
    void dir;
  }
  for (const name of expected) {
    if (!seen.has(name)) throw new Error(`inventory missing ${name}`);
  }
  return inventory;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/** Minimal consumer smokes keyed by package name. */
const CONSUMER_SMOKES = {
  "agent-inspect": {
    peers: [],
    esm: `
      import { createInspector } from "agent-inspect";
      if (typeof createInspector !== "function") throw new Error("createInspector missing");
    `,
    cjs: `
      const { createInspector } = require("agent-inspect");
      if (typeof createInspector !== "function") throw new Error("createInspector missing");
    `,
    bin: "agent-inspect",
  },
  "@agent-inspect/langchain": {
    peers: ["@langchain/core@1.0.0"],
    esm: `
      import { extractModelName, safePreview } from "@agent-inspect/langchain";
      if (extractModelName({ model: "fixture-model" }) !== "fixture-model") throw new Error("model");
      if (safePreview({ ok: true }, 20) === undefined) throw new Error("preview");
    `,
    cjs: `
      const { extractModelName } = require("@agent-inspect/langchain");
      if (extractModelName({ model: "x" }) !== "x") throw new Error("model");
    `,
  },
  "@agent-inspect/redact": {
    peers: [],
    needsRoot: false,
    esm: `
      import { redact } from "@agent-inspect/redact";
      if (redact({ token: "secret" }).value.token !== "[REDACTED]") throw new Error("redact");
    `,
    cjs: `
      const { redact } = require("@agent-inspect/redact");
      if (redact({ token: "secret" }).value.token !== "[REDACTED]") throw new Error("redact");
    `,
  },
  "@agent-inspect/tui": {
    peers: [],
    esm: `
      import { mapInputToAction } from "@agent-inspect/tui";
      if (mapInputToAction("q") !== "quit") throw new Error("keymap");
    `,
    cjs: `
      const { mapInputToAction } = require("@agent-inspect/tui");
      if (mapInputToAction("q") !== "quit") throw new Error("keymap");
    `,
  },
  "@agent-inspect/ai-sdk": {
    peers: ["ai@6.0.210"],
    esm: `
      import { agentInspect } from "@agent-inspect/ai-sdk";
      const d = agentInspect({ capture: "preview" }).getDiagnostics();
      if (d.capture.capture !== "preview") throw new Error("capture");
    `,
    cjs: `
      const { agentInspect } = require("@agent-inspect/ai-sdk");
      agentInspect({ capture: "metadata-only" }).getDiagnostics();
    `,
  },
  "@agent-inspect/openai-agents": {
    peers: ["@openai/agents@^0.12.0"],
    esm: `
      import { agentInspectProcessor } from "@agent-inspect/openai-agents";
      if (!agentInspectProcessor().localOnly) throw new Error("localOnly");
    `,
    cjs: `
      const { agentInspectProcessor } = require("@agent-inspect/openai-agents");
      if (!agentInspectProcessor().localOnly) throw new Error("localOnly");
    `,
  },
  "@agent-inspect/eval": {
    peers: [],
    bundled: ["@agent-inspect/redact", "@agent-inspect/guardrails", "@agent-inspect/circuit"],
    esm: `
      import { checks, evalRun } from "@agent-inspect/eval";
      const read = {
        format: "agent-inspect-jsonl",
        runs: [{ runId: "r", status: "ok", children: [], metadata: {
          totalEvents: 0,
          confidenceBreakdown: { explicit: 0, correlated: 0, heuristic: 0, unknown: 0 },
          kinds: { RUN: 0, AGENT: 0, LLM: 0, TOOL: 0, CHAIN: 0, RETRIEVER: 0, DECISION: 0, RESULT: 0, ERROR: 0, LOGIC: 0, LOG: 0, OUTCOME: 0 }
        }}],
        events: [], warnings: [], unsupportedFields: [], sourceFiles: []
      };
      const result = await evalRun(read, { checks: [checks.requireSuccess()] });
      if (!result.ok) throw new Error("eval");
    `,
    cjs: `
      const { checks, evalRun } = require("@agent-inspect/eval");
      if (typeof checks.requireSuccess !== "function") throw new Error("checks");
      if (typeof evalRun !== "function") throw new Error("evalRun");
    `,
  },
  "@agent-inspect/guardrails": {
    peers: [],
    esm: `
      import * as g from "@agent-inspect/guardrails";
      if (!g || typeof g !== "object") throw new Error("guardrails");
    `,
    cjs: `
      const g = require("@agent-inspect/guardrails");
      if (!g || typeof g !== "object") throw new Error("guardrails");
    `,
  },
  "@agent-inspect/circuit": {
    peers: [],
    esm: `
      import * as c from "@agent-inspect/circuit";
      if (!c || typeof c !== "object") throw new Error("circuit");
    `,
    cjs: `
      const c = require("@agent-inspect/circuit");
      if (!c || typeof c !== "object") throw new Error("circuit");
    `,
  },
  "@agent-inspect/vitest": {
    peers: ["vitest@3.2.7"],
    esm: `
      import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";
      if (typeof createAgentInspectVitestReporter({}).onTestCaseResult !== "function") throw new Error("hook");
    `,
    cjs: `
      const { createAgentInspectVitestReporter } = require("@agent-inspect/vitest");
      createAgentInspectVitestReporter({});
    `,
  },
  "@agent-inspect/jest": {
    peers: ["jest@30.2.0"],
    esm: `
      import { createAgentInspectJestReporter } from "@agent-inspect/jest";
      if (typeof createAgentInspectJestReporter({}).onTestResult !== "function") throw new Error("hook");
    `,
    cjs: `
      const { createAgentInspectJestReporter } = require("@agent-inspect/jest");
      createAgentInspectJestReporter({});
    `,
  },
  "@agent-inspect/mcp": {
    peers: [],
    esm: `
      import * as m from "@agent-inspect/mcp";
      if (!m || typeof m !== "object") throw new Error("mcp");
    `,
    cjs: `
      const m = require("@agent-inspect/mcp");
      if (!m || typeof m !== "object") throw new Error("mcp");
    `,
  },
  "@agent-inspect/mcp-server": {
    peers: [],
    esm: `
      import * as m from "@agent-inspect/mcp-server";
      if (!m || typeof m !== "object") throw new Error("mcp-server");
    `,
    cjs: `
      const m = require("@agent-inspect/mcp-server");
      if (!m || typeof m !== "object") throw new Error("mcp-server");
    `,
    bin: "agent-inspect-mcp-server",
  },
  "@agent-inspect/viewer": {
    peers: [],
    // Localhost UI package: require loadable public API only (no browser).
    esm: `
      import * as v from "@agent-inspect/viewer";
      if (!v || typeof v !== "object") throw new Error("viewer");
    `,
    cjs: `
      const v = require("@agent-inspect/viewer");
      if (!v || typeof v !== "object") throw new Error("viewer");
    `,
  },
  "@agent-inspect/studio": {
    peers: [],
    // better-sqlite3 is a dependency; install with scripts allowed for native binding.
    allowScripts: ["better-sqlite3"],
    esm: `
      import * as s from "@agent-inspect/studio";
      if (!s || typeof s !== "object") throw new Error("studio");
    `,
    cjs: `
      const s = require("@agent-inspect/studio");
      if (!s || typeof s !== "object") throw new Error("studio");
    `,
  },
  "@agent-inspect/adapter-sdk": {
    peers: [],
    esm: `
      import * as a from "@agent-inspect/adapter-sdk";
      if (!a || typeof a !== "object") throw new Error("adapter-sdk");
    `,
    cjs: `
      const a = require("@agent-inspect/adapter-sdk");
      if (!a || typeof a !== "object") throw new Error("adapter-sdk");
    `,
  },
  "@agent-inspect/harness": {
    peers: [],
    esm: `
      import * as h from "@agent-inspect/harness";
      if (!h || typeof h !== "object") throw new Error("harness");
    `,
    cjs: `
      const h = require("@agent-inspect/harness");
      if (!h || typeof h !== "object") throw new Error("harness");
    `,
  },
  "@agent-inspect/index-sqlite": {
    peers: [],
    allowScripts: ["better-sqlite3"],
    esm: `
      import * as i from "@agent-inspect/index-sqlite";
      if (!i || typeof i !== "object") throw new Error("index-sqlite");
    `,
    cjs: `
      const i = require("@agent-inspect/index-sqlite");
      if (!i || typeof i !== "object") throw new Error("index-sqlite");
    `,
  },
};

function tarballPathFor(artifactsDir, inventory, name) {
  const pkg = inventory.packages.find((p) => p.name === name);
  if (!pkg) throw new Error(`inventory missing ${name}`);
  return path.join(artifactsDir, pkg.tarball);
}

function npmInstall(cwd, packages, { allowScripts = [] } = {}) {
  const args = ["install", "--no-fund", "--no-audit"];
  if (allowScripts.length === 0) {
    args.push("--ignore-scripts");
  }
  args.push(...packages);
  run("npm install", "npm", args, {
    cwd,
    env: {
      ...process.env,
      ...(allowScripts.length
        ? {}
        : {}),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Install verified tarballs into a fresh temp workspace and run consumer smokes.
 */
export function qualifyConsumers(artifactsDir, { keep = false } = {}) {
  const inventory = validateInventory(artifactsDir);
  const base = path.join(
    os.tmpdir(),
    `agent-inspect-release-qualify-${process.pid}-${Date.now()}`,
  );
  mkdirSync(base, { recursive: true });
  const results = [];

  try {
    for (const name of inventory.expectedNames) {
      const smoke = CONSUMER_SMOKES[name];
      if (!smoke) {
        throw new Error(`no consumer smoke defined for ${name}`);
      }
      const dir = path.join(base, name.replace(/[/@]/g, "_"));
      mkdirSync(dir, { recursive: true });
      writeJson(path.join(dir, "package.json"), {
        name: "agent-inspect-release-qualify",
        private: true,
        type: "module",
      });

      const installs = [];
      const rootTgz = tarballPathFor(artifactsDir, inventory, "agent-inspect");
      if (name !== "agent-inspect" && smoke.needsRoot !== false) {
        installs.push(rootTgz);
      }
      if (Array.isArray(smoke.bundled)) {
        for (const dep of smoke.bundled) {
          installs.push(tarballPathFor(artifactsDir, inventory, dep));
        }
      }
      installs.push(tarballPathFor(artifactsDir, inventory, name));
      if (Array.isArray(smoke.peers)) installs.push(...smoke.peers);

      npmInstall(dir, installs, { allowScripts: smoke.allowScripts ?? [] });

      if (smoke.esm) {
        writeFileSync(path.join(dir, "esm-smoke.mjs"), smoke.esm);
        run(`${name} ESM`, process.execPath, ["esm-smoke.mjs"], { cwd: dir });
      }
      if (smoke.cjs) {
        const cjsDir = path.join(dir, "cjs");
        mkdirSync(cjsDir, { recursive: true });
        writeJson(path.join(cjsDir, "package.json"), {
          name: "cjs-smoke",
          private: true,
          type: "commonjs",
        });
        // Reuse node_modules from parent via symlink
        const link = path.join(cjsDir, "node_modules");
        if (!existsSync(link)) {
          execFileSync("ln", ["-s", path.join(dir, "node_modules"), link]);
        }
        writeFileSync(path.join(cjsDir, "cjs-smoke.cjs"), smoke.cjs);
        run(`${name} CJS`, process.execPath, ["cjs-smoke.cjs"], { cwd: cjsDir });
      }
      if (smoke.bin) {
        const binPath = path.join(dir, "node_modules", ".bin", smoke.bin);
        if (!existsSync(binPath)) {
          throw new Error(`${name}: missing bin ${smoke.bin}`);
        }
        // --help may exit non-zero for some CLIs; existence is the gate.
      }

      // .mts / .cts declaration resolution for packages that ship types
      const typesEntry = inventory.packages.find((p) => p.name === name)?.entryTargets?.find(
        (t) => t.endsWith(".d.ts") || t.endsWith(".d.cts"),
      );
      if (typesEntry) {
        const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
        if (existsSync(tsc)) {
          writeFileSync(
            path.join(dir, "types-smoke.ts"),
            `import "${name}";\n`,
          );
          writeJson(path.join(dir, "tsconfig.json"), {
            compilerOptions: {
              module: "NodeNext",
              moduleResolution: "NodeNext",
              target: "ES2022",
              strict: true,
              skipLibCheck: true,
              noEmit: true,
            },
            include: ["types-smoke.ts"],
          });
          run(`${name} types`, process.execPath, [tsc, "--project", "tsconfig.json"], {
            cwd: dir,
          });
        }
      }

      results.push({ name, ok: true });
    }
  } finally {
    if (!keep) {
      rmSync(base, { recursive: true, force: true });
    } else {
      console.error(`[release-artifacts] kept qualify dir: ${base}`);
    }
  }

  return { inventory, results, keepDir: keep ? base : null };
}

/**
 * Publish exact verified tarballs with npm (OIDC / provenance via env).
 * Does not rebuild. Creates git tags matching Changesets naming when possible.
 */
export function publishVerifiedArtifacts(artifactsDir, { dryRun = false } = {}) {
  const inventory = validateInventory(artifactsDir, {
    expectedSourceSha: process.env.AGENT_INSPECT_REQUIRE_SOURCE_SHA || undefined,
  });
  const head = gitHeadSha();
  if (inventory.sourceSha !== "unknown" && inventory.sourceSha !== head) {
    // Allow GITHUB_SHA mismatch only when explicitly overridden.
    if (process.env.AGENT_INSPECT_ALLOW_SOURCE_SHA_MISMATCH !== "1") {
      throw new Error(
        `refusing to publish: inventory sourceSha ${inventory.sourceSha} !== HEAD ${head}`,
      );
    }
  }

  for (const pkg of inventory.packages) {
    const tgzPath = path.join(artifactsDir, pkg.tarball);
    // Idempotent re-run: skip versions already on the registry (partial publish recovery).
    if (!dryRun) {
      const viewed = spawnSync(
        "npm",
        ["view", `${pkg.name}@${pkg.version}`, "version", "--json"],
        {
          cwd: root,
          encoding: "utf8",
          env: process.env,
        },
      );
      const viewedOut = `${viewed.stdout || ""}`.trim();
      if (viewed.status === 0 && viewedOut) {
        try {
          const v = JSON.parse(viewedOut);
          if (v === pkg.version || (Array.isArray(v) && v.includes(pkg.version))) {
            console.error(`[release-artifacts] skip already published ${pkg.name}@${pkg.version}`);
            continue;
          }
        } catch {
          // Non-JSON view output — fall through to publish.
        }
      }
    }
    const args = ["publish", tgzPath, "--access", "public"];
    if (dryRun) args.push("--dry-run");
    run(`npm publish ${pkg.name}`, "npm", args, {
      env: {
        ...process.env,
        NPM_CONFIG_PROVENANCE: process.env.NPM_CONFIG_PROVENANCE || "true",
      },
    });
  }

  if (!dryRun) {
    // Tag bookkeeping aligned with Changesets package@version tags.
    for (const pkg of inventory.packages) {
      const tag = `${pkg.name}@${pkg.version}`;
      const existing = spawnSync("git", ["rev-parse", `refs/tags/${tag}`], {
        cwd: root,
        encoding: "utf8",
      });
      if (existing.status === 0) continue;
      run(`git tag ${tag}`, "git", ["tag", tag], { cwd: root });
    }
  }

  return inventory;
}

export { CONSUMER_SMOKES };
