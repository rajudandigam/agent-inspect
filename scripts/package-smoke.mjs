/**
 * Install the packed tarball into a temp dir and verify ESM import + local bin CLI.
 * Uses only Node built-ins. Run from repo root: pnpm run pack:smoke
 */
import { execSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.env.AGENT_INSPECT_KEEP_SMOKE_DIR === "true";
const expectedVersion = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).version;
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

const optionalPackageChecks = [
  {
    dir: "packages/ai-sdk",
    name: "@agent-inspect/ai-sdk",
    peerDependencies: { ai: "^6.0.0" },
    installPeers: ["ai@6.0.210"],
    esm: `
      import { agentInspect } from "@agent-inspect/ai-sdk";
      const integration = agentInspect({ capture: "preview" });
      if (integration.getDiagnostics().lifecycleWarnings !== 1) throw new Error("missing preview diagnostic");
    `,
    cjs: `
      const { agentInspect } = require("@agent-inspect/ai-sdk");
      const integration = agentInspect({ capture: "preview" });
      if (integration.getDiagnostics().lifecycleWarnings !== 1) throw new Error("missing preview diagnostic");
    `,
    ts: `
      import { agentInspect, type AgentInspectAiSdkOptions } from "@agent-inspect/ai-sdk";
      const options: AgentInspectAiSdkOptions = { capture: "metadata-only" };
      agentInspect(options).getDiagnostics();
    `,
  },
  {
    dir: "packages/langchain",
    name: "@agent-inspect/langchain",
    peerDependencies: { "@langchain/core": "^1.0.0" },
    installPeers: ["@langchain/core@1.0.0"],
    esm: `
      import { extractModelName, safePreview } from "@agent-inspect/langchain";
      if (extractModelName({ model: "fixture-model" }) !== "fixture-model") throw new Error("model extraction failed");
      if (safePreview({ ok: true }, 20) === undefined) throw new Error("preview failed");
    `,
    cjs: `
      const { extractModelName, safePreview } = require("@agent-inspect/langchain");
      if (extractModelName({ model: "fixture-model" }) !== "fixture-model") throw new Error("model extraction failed");
      if (safePreview({ ok: true }, 20) === undefined) throw new Error("preview failed");
    `,
    ts: `
      import { AgentInspectCallback, type AgentInspectCallbackOptions } from "@agent-inspect/langchain";
      const options: AgentInspectCallbackOptions = { runName: "packed-langchain-smoke" };
      new AgentInspectCallback(options).getEvents();
    `,
  },
  {
    dir: "packages/tui",
    name: "@agent-inspect/tui",
    peerDependencies: {},
    installPeers: [],
    esm: `
      import { countTreeSteps, mapInputToAction } from "@agent-inspect/tui";
      if (mapInputToAction("q") !== "quit") throw new Error("keymap failed");
      if (countTreeSteps([]) !== 0) throw new Error("tree count failed");
    `,
    cjs: `
      const { countTreeSteps, mapInputToAction } = require("@agent-inspect/tui");
      if (mapInputToAction("q") !== "quit") throw new Error("keymap failed");
      if (countTreeSteps([]) !== 0) throw new Error("tree count failed");
    `,
    ts: `
      import { mapInputToAction, type TuiAction } from "@agent-inspect/tui";
      const action: TuiAction = mapInputToAction("q");
      if (action !== "quit") throw new Error("keymap failed");
    `,
  },
  {
    dir: "packages/vitest",
    name: "@agent-inspect/vitest",
    peerDependencies: { vitest: "^2.1.0" },
    installPeers: ["vitest@2.1.8"],
    esm: `
      import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";
      const reporter = createAgentInspectVitestReporter({ retainSuccessful: 1 });
      if (typeof reporter.onTestCaseResult !== "function") throw new Error("reporter hook missing");
      if (reporter.getArtifacts().length !== 0) throw new Error("unexpected artifacts");
    `,
    cjs: `
      const { createAgentInspectVitestReporter } = require("@agent-inspect/vitest");
      const reporter = createAgentInspectVitestReporter({ retainSuccessful: 1 });
      if (typeof reporter.onTestCaseResult !== "function") throw new Error("reporter hook missing");
      if (reporter.getArtifacts().length !== 0) throw new Error("unexpected artifacts");
    `,
    ts: `
      import { createAgentInspectVitestReporter, type AgentInspectVitestReporterOptions } from "@agent-inspect/vitest";
      const options: AgentInspectVitestReporterOptions = { retainSuccessful: 1 };
      createAgentInspectVitestReporter(options).getDiagnostics();
    `,
  },
  {
    dir: "packages/jest",
    name: "@agent-inspect/jest",
    peerDependencies: { jest: "^29.0.0 || ^30.0.0" },
    installPeers: ["jest@30.2.0"],
    esm: `
      import { createAgentInspectJestReporter } from "@agent-inspect/jest";
      const reporter = createAgentInspectJestReporter({ retainSuccessful: 1 });
      if (typeof reporter.onTestResult !== "function") throw new Error("reporter hook missing");
      if (reporter.getArtifacts().length !== 0) throw new Error("unexpected artifacts");
    `,
    cjs: `
      const { createAgentInspectJestReporter } = require("@agent-inspect/jest");
      const reporter = createAgentInspectJestReporter({ retainSuccessful: 1 });
      if (typeof reporter.onTestResult !== "function") throw new Error("reporter hook missing");
      if (reporter.getArtifacts().length !== 0) throw new Error("unexpected artifacts");
    `,
    ts: `
      import { createAgentInspectJestReporter, type AgentInspectJestReporterOptions } from "@agent-inspect/jest";
      const options: AgentInspectJestReporterOptions = { retainSuccessful: 1 };
      createAgentInspectJestReporter(options).getDiagnostics();
    `,
  },
  {
    dir: "packages/openai-agents",
    name: "@agent-inspect/openai-agents",
    peerDependencies: { "@openai/agents": "^0.12.0" },
    installPeers: ["@openai/agents@^0.12.0"],
    esm: `
      import { agentInspectProcessor } from "@agent-inspect/openai-agents";
      const processor = agentInspectProcessor();
      if (processor.installMode !== "setTraceProcessors") throw new Error("install mode failed");
      if (!processor.localOnly) throw new Error("local-only flag failed");
    `,
    cjs: `
      const { agentInspectProcessor } = require("@agent-inspect/openai-agents");
      const processor = agentInspectProcessor();
      if (processor.installMode !== "setTraceProcessors") throw new Error("install mode failed");
      if (!processor.localOnly) throw new Error("local-only flag failed");
    `,
    ts: `
      import { agentInspectProcessor, type AgentInspectOpenAiAgentsOptions } from "@agent-inspect/openai-agents";
      const options: AgentInspectOpenAiAgentsOptions = { capture: "metadata-only" };
      agentInspectProcessor(options).getDiagnostics();
    `,
  },
  {
    dir: "packages/redact",
    name: "@agent-inspect/redact",
    peerDependencies: {},
    installPeers: [],
    requiresAgentInspectDependency: false,
    esm: `
      import { redact } from "@agent-inspect/redact";
      const result = redact({ token: "secret", ok: true });
      if (result.value.token !== "[REDACTED]") throw new Error("redaction failed");
      if (result.findings.length !== 1) throw new Error("finding missing");
    `,
    cjs: `
      const { redact } = require("@agent-inspect/redact");
      const result = redact({ token: "secret", ok: true });
      if (result.value.token !== "[REDACTED]") throw new Error("redaction failed");
      if (result.findings.length !== 1) throw new Error("finding missing");
    `,
    ts: `
      import { redact, type RedactionFinding, type RedactionProfile } from "@agent-inspect/redact";
      const profile: RedactionProfile = "share";
      const result = redact({ correlationId: "corr" }, { profile });
      const finding: RedactionFinding | undefined = result.findings[0];
      if (!finding || finding.detector !== "key.correlationid") throw new Error("finding type failed");
    `,
  },
  {
    dir: "packages/eval",
    name: "@agent-inspect/eval",
    bundledWorkspaceDirs: ["packages/redact", "packages/guardrails", "packages/circuit"],
    peerDependencies: {},
    installPeers: [],
    esm: `
      import { checks, evalRun, renderEvalMarkdown } from "@agent-inspect/eval";
      const read = {
        format: "agent-inspect-jsonl",
        runs: [{
          runId: "run-smoke",
          status: "ok",
          children: [],
          metadata: {
            totalEvents: 0,
            confidenceBreakdown: { explicit: 0, correlated: 0, heuristic: 0, unknown: 0 },
            kinds: { RUN: 0, AGENT: 0, LLM: 0, TOOL: 0, CHAIN: 0, RETRIEVER: 0, DECISION: 0, RESULT: 0, ERROR: 0, LOGIC: 0, LOG: 0 }
          }
        }],
        events: [],
        warnings: [],
        unsupportedFields: [],
        sourceFiles: []
      };
      const result = await evalRun(read, { checks: [checks.requireSuccess()] });
      if (!result.ok) throw new Error("eval failed");
      if (!renderEvalMarkdown(result).includes("Status: pass")) throw new Error("markdown failed");
    `,
    cjs: `
      const { checks, evalRun, renderEvalMarkdown } = require("@agent-inspect/eval");
      const read = {
        format: "agent-inspect-jsonl",
        runs: [{
          runId: "run-smoke",
          status: "ok",
          children: [],
          metadata: {
            totalEvents: 0,
            confidenceBreakdown: { explicit: 0, correlated: 0, heuristic: 0, unknown: 0 },
            kinds: { RUN: 0, AGENT: 0, LLM: 0, TOOL: 0, CHAIN: 0, RETRIEVER: 0, DECISION: 0, RESULT: 0, ERROR: 0, LOGIC: 0, LOG: 0 }
          }
        }],
        events: [],
        warnings: [],
        unsupportedFields: [],
        sourceFiles: []
      };
      (async () => {
        const result = await evalRun(read, { checks: [checks.requireSuccess()] });
        if (!result.ok) throw new Error("eval failed");
        if (!renderEvalMarkdown(result).includes("Status: pass")) throw new Error("markdown failed");
      })();
    `,
    ts: `
      import { checks, evalRun, type EvalRunResult } from "@agent-inspect/eval";
      const result: Promise<EvalRunResult> = evalRun({
        format: "agent-inspect-jsonl",
        runs: [{
          runId: "run-smoke",
          status: "ok",
          children: [],
          metadata: {
            totalEvents: 0,
            confidenceBreakdown: { explicit: 0, correlated: 0, heuristic: 0, unknown: 0 },
            kinds: { RUN: 0, AGENT: 0, LLM: 0, TOOL: 0, CHAIN: 0, RETRIEVER: 0, DECISION: 0, RESULT: 0, ERROR: 0, LOGIC: 0, LOG: 0 }
          }
        }],
        events: [],
        warnings: [],
        unsupportedFields: [],
        sourceFiles: []
      }, { checks: [checks.requireSuccess()] });
      void result;
    `,
  },
  {
    dir: "packages/mcp",
    name: "@agent-inspect/mcp",
    peerDependencies: {},
    installPeers: [],
    esm: `
      import { wrapMcpClient, summarizeMcpValue } from "@agent-inspect/mcp";
      const summary = summarizeMcpValue({ ok: true });
      if (!summary.includes("ok")) throw new Error("summarize failed");
      const client = wrapMcpClient({
        async callTool() { return { content: [] }; },
      });
      if (typeof client.callTool !== "function") throw new Error("wrap failed");
    `,
    cjs: `
      const { wrapMcpClient, summarizeMcpValue } = require("@agent-inspect/mcp");
      const summary = summarizeMcpValue({ ok: true });
      if (!summary.includes("ok")) throw new Error("summarize failed");
      const client = wrapMcpClient({
        async callTool() { return { content: [] }; },
      });
      if (typeof client.callTool !== "function") throw new Error("wrap failed");
    `,
    ts: `
      import { wrapMcpClient, type McpClientLike } from "@agent-inspect/mcp";
      const client: McpClientLike = wrapMcpClient({
        async callTool() { return { content: [] }; },
      });
      void client;
    `,
  },
  {
    dir: "packages/guardrails",
    name: "@agent-inspect/guardrails",
    requiresAgentInspectDependency: false,
    bundledWorkspaceDirs: ["packages/redact"],
    peerDependencies: {},
    installPeers: [],
    esm: `
      import { runGuardrails } from "@agent-inspect/guardrails";
      const result = runGuardrails({ text: "hello" }, {
        rules: ["guardrail.banned-phrase"],
        bannedPhrase: { phrases: ["blocked"] },
      });
      if (!result.ok) throw new Error("unexpected fail");
    `,
    cjs: `
      const { runGuardrails } = require("@agent-inspect/guardrails");
      const result = runGuardrails({ text: "hello" }, {
        rules: ["guardrail.banned-phrase"],
        bannedPhrase: { phrases: ["blocked"] },
      });
      if (!result.ok) throw new Error("unexpected fail");
    `,
    ts: `
      import { runGuardrails, type GuardrailRunResult } from "@agent-inspect/guardrails";
      const result: GuardrailRunResult = runGuardrails({ text: "hello" });
      void result;
    `,
  },
  {
    dir: "packages/circuit",
    name: "@agent-inspect/circuit",
    requiresAgentInspectDependency: false,
    peerDependencies: {},
    installPeers: [],
    esm: `
      import { runCircuits } from "@agent-inspect/circuit";
      const result = runCircuits([], { rules: [] });
      if (!result.ok) throw new Error("unexpected fail");
    `,
    cjs: `
      const { runCircuits } = require("@agent-inspect/circuit");
      const result = runCircuits([], { rules: [] });
      if (!result.ok) throw new Error("unexpected fail");
    `,
    ts: `
      import { runCircuits, type CircuitRunResult } from "@agent-inspect/circuit";
      const result: CircuitRunResult = runCircuits([]);
      void result;
    `,
  },
];

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
    "migrate",
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

function fail(label, detail) {
  console.error(`[pack:smoke] ${label}`);
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

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readPackedPackageJson(tgzPath) {
  const result = run("read packed package.json", "tar", [
    "-xOf",
    tgzPath,
    "package/package.json",
  ]);
  return JSON.parse(result.stdout);
}

function assertNoWorkspaceProtocol(packageName, manifest) {
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ]) {
    const deps = manifest[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        fail(`${packageName} packed manifest still contains workspace dependency`, `${field}.${name}: ${version}`);
      }
    }
  }
}

function assertOptionalPackedManifest(check, manifest) {
  if (manifest.name !== check.name) {
    fail(`${check.name} packed manifest name mismatch`, manifest.name);
  }
  if (manifest.version !== expectedVersion) {
    fail(`${check.name} packed manifest version mismatch`, manifest.version);
  }
  assertNoWorkspaceProtocol(check.name, manifest);

  if (check.requiresAgentInspectDependency !== false && manifest.dependencies?.["agent-inspect"] !== expectedVersion) {
    fail(
      `${check.name} packed manifest did not rewrite agent-inspect workspace dependency`,
      JSON.stringify(manifest.dependencies ?? {}, null, 2),
    );
  }

  for (const [peerName, peerRange] of Object.entries(check.peerDependencies)) {
    if (manifest.peerDependencies?.[peerName] !== peerRange) {
      fail(
        `${check.name} peer dependency mismatch for ${peerName}`,
        JSON.stringify(manifest.peerDependencies ?? {}, null, 2),
      );
    }
    if (manifest.dependencies?.[peerName] !== undefined) {
      fail(`${check.name} peer dependency leaked into dependencies`, peerName);
    }
  }
}

function packWorkspacePackage(check, tarballDir) {
  const packageDir = path.join(root, check.dir);
  const packProc = run(
    `${check.name} pnpm pack`,
    "pnpm",
    ["--dir", packageDir, "pack", "--pack-destination", tarballDir],
    {
      env: {
        ...process.env,
        npm_config_json: "false",
        NPM_CONFIG_JSON: "false",
      },
    },
  );
  const packOut = `${packProc.stdout || ""}\n${packProc.stderr || ""}`.trim();
  const tgzName = parsePackedFilename(packOut);
  if (!tgzName || !tgzName.endsWith(".tgz")) {
    fail(`${check.name} could not parse .tgz name from pnpm pack`, packOut);
  }
  const tgzPath = path.isAbsolute(tgzName) ? tgzName : path.join(tarballDir, tgzName);
  if (!existsSync(tgzPath)) {
    fail(`${check.name} tarball missing`, tgzPath);
  }
  return tgzPath;
}

function npmInstall(label, cwd, packages) {
  run(label, "npm", ["install", "--ignore-scripts", ...packages], {
    cwd,
    stdio: "inherit",
  });
}

function writeConsumerPackageJson(dir, type = "module") {
  writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify({ name: "agent-inspect-optional-smoke", private: true, type }, null, 2)}\n`,
  );
}

function runOptionalConsumer(check, installDir) {
  if (!check.esm.trim() || !check.cjs.trim() || !check.ts.trim()) {
    fail(`${check.name} optional package smoke is incomplete`);
  }

  writeFileSync(path.join(installDir, "esm-smoke.mjs"), check.esm);
  run(`${check.name} ESM import/runtime`, process.execPath, ["esm-smoke.mjs"], {
    cwd: installDir,
  });

  const cjsDir = path.join(installDir, "cjs-check");
  mkdirSync(cjsDir, { recursive: true });
  writeConsumerPackageJson(cjsDir, "commonjs");
  writeFileSync(path.join(cjsDir, "cjs-smoke.cjs"), check.cjs);
  run(`${check.name} CJS require/runtime`, process.execPath, ["cjs-smoke.cjs"], {
    cwd: cjsDir,
  });

  writeFileSync(
    path.join(installDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          target: "ES2022",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ["types-smoke.ts"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(path.join(installDir, "types-smoke.ts"), check.ts);
  run(`${check.name} TypeScript declarations`, process.execPath, [tscBin, "--project", "tsconfig.json"], {
    cwd: installDir,
  });
}

function smokeOptionalPackages(rootTgzPath, tmpRoot) {
  const tarballDir = path.join(tmpRoot, "optional-tarballs");
  mkdirSync(tarballDir, { recursive: true });
  const smoked = [];
  const skipped = [];
  const packedByDir = new Map();

  function packOptionalByDir(dir) {
    if (packedByDir.has(dir)) return packedByDir.get(dir);
    const depCheck = optionalPackageChecks.find((item) => item.dir === dir);
    if (!depCheck) {
      fail(`unknown bundled workspace package dir for pack:smoke: ${dir}`);
    }
    const tgzPath = packWorkspacePackage(depCheck, tarballDir);
    packedByDir.set(dir, tgzPath);
    return tgzPath;
  }

  for (const check of optionalPackageChecks) {
    const manifest = readJson(path.join(root, check.dir, "package.json"));
    if (manifest.private === true) {
      skipped.push(check.name);
      continue;
    }
    if (manifest.publishConfig?.access !== "public") {
      skipped.push(check.name);
      continue;
    }

    const optionalTgzPath = packWorkspacePackage(check, tarballDir);
    const packedManifest = readPackedPackageJson(optionalTgzPath);
    assertOptionalPackedManifest(check, packedManifest);

    const installDir = path.join(
      tmpRoot,
      `optional-${check.name.replace(/[@/]/g, "-")}`,
    );
    mkdirSync(installDir, { recursive: true });
    writeConsumerPackageJson(installDir);
    const bundledTarballs = (check.bundledWorkspaceDirs ?? []).map((dir) => packOptionalByDir(dir));
    npmInstall(`${check.name} clean install`, installDir, [
      rootTgzPath,
      optionalTgzPath,
      ...bundledTarballs,
      ...check.installPeers,
    ]);
    runOptionalConsumer(check, installDir);
    smoked.push(check.name);
  }

  if (smoked.length === 0) {
    fail("no public optional packages were smoked");
  }

  console.log(
    `[pack:smoke] optional packages OK: ${smoked.join(", ")}${skipped.length > 0 ? ` (skipped private/non-public: ${skipped.join(", ")})` : ""}`,
  );
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

  const binVersion = spawnSync(binPath, ["--version"], {
    cwd: tmpRoot,
    encoding: "utf8",
  });
  if (
    binVersion.status !== 0 ||
    binVersion.stdout.trim() !== expectedVersion
  ) {
    console.error(
      `[pack:smoke] CLI version mismatch: expected ${expectedVersion}, got ${binVersion.stdout.trim() || "<empty>"}\n${binVersion.stderr}`,
    );
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

  smokeOptionalPackages(tgzPath, tmpRoot);

  console.log(
    `[pack:smoke] OK: tarball install, ESM import, CJS require, CLI ${expectedVersion}, optional package installs, and local bin / npm exec / npx --no-install --help`,
  );
} finally {
  if (!keep) {
    rmSync(tmpRoot, { recursive: true, force: true });
    rmSync(tgzPath, { force: true });
  } else {
    console.log("[pack:smoke] kept:", tmpRoot, tgzPath);
  }
}
