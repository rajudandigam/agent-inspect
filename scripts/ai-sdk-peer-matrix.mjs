/**
 * Isolated AI SDK peer matrix (6.x and 7.x).
 * Does not raise root Node engines. Run from repo root after build:
 *   node scripts/ai-sdk-peer-matrix.mjs
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PEERS = [
  { id: "ai-6", range: "ai@^6.0.0", required: true },
  {
    id: "ai-7",
    range: "ai@^7.0.0",
    required: false,
    // AI SDK 7 removed bindTelemetryIntegration; keep as soft probe only.
    softBlockMarker: "BLOCKED_ON_AI_SDK7_TELEMETRY_API",
  },
];

function fail(message, detail = "") {
  throw new Error(
    `[ai-sdk-peer-matrix] ${message}${detail ? `\n${detail}` : ""}`,
  );
}

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    fail(
      `${label} failed`,
      `${result.error?.message ?? ""}\n${result.stdout || ""}\n${result.stderr || ""}`.trim(),
    );
  }
  return result;
}

function packPackage(label, packageDir, tarballDir) {
  const before = new Set(readdirSync(tarballDir));
  run(
    label,
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
  const after = readdirSync(tarballDir).filter((name) => !before.has(name));
  if (after.length !== 1) {
    fail(`${label} expected one tarball`, after.join(", "));
  }
  return path.join(tarballDir, after[0]);
}

function writeConsumer(dir, peerRange) {
  writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "ai-sdk-peer-matrix-consumer",
        private: true,
        type: "module",
        dependencies: {},
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(dir, "smoke.mjs"),
    `import { createRequire } from "node:module";
import { generateText } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";
import { memoryWriter } from "agent-inspect/writers";

const require = createRequire(import.meta.url);
const aiPkg = require("ai/package.json");
const writer = memoryWriter();
const integration = agentInspect({
  writer,
  runName: "peer-matrix",
  capture: "metadata-only",
});

await generateText({
  model: new MockLanguageModelV3({
    provider: "fixture-provider",
    modelId: "fixture-model",
    doGenerate: {
      content: [{ type: "text", text: "matrix answer" }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 4, noCache: 2, cacheRead: 1, cacheWrite: 1 },
        outputTokens: { total: 3, text: 2, reasoning: 1 },
      },
      response: {
        id: "matrix-response",
        modelId: "fixture-model",
        timestamp: new Date("2026-09-12T00:00:00.000Z"),
      },
      warnings: [],
    },
  }),
  prompt: "matrix prompt",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [integration],
  },
});

const events = writer.getEvents();
const llmOk = events.find((e) => e.kind === "LLM" && e.status === "ok");
if (!llmOk?.tokenUsage) {
  throw new Error("missing tokenUsage on LLM ok event");
}
const usage = llmOk.tokenUsage;
if (usage.input !== 4 || usage.output !== 3) {
  throw new Error(\`unexpected input/output: \${JSON.stringify(usage)}\`);
}
if (usage.cached !== 1) {
  throw new Error(\`expected cached=1, got \${JSON.stringify(usage)}\`);
}
// cacheWrite / reasoning preserved when present on nested or flat usage
if (usage.cacheWrite !== undefined && usage.cacheWrite !== 1) {
  throw new Error(\`unexpected cacheWrite: \${JSON.stringify(usage)}\`);
}
if (usage.reasoning !== undefined && usage.reasoning !== 1) {
  throw new Error(\`unexpected reasoning: \${JSON.stringify(usage)}\`);
}

console.log(JSON.stringify({
  peer: ${JSON.stringify(peerRange)},
  aiVersion: aiPkg.version,
  tokenUsage: usage,
  ok: true,
}));
`,
  );
}

function runPeer(peer, coreTgz, adapterTgz) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `ai-peer-${peer.id}-`));
  try {
    writeConsumer(dir, peer.range);
    run("npm install peer+packs", "npm", [
      "install",
      "--no-package-lock",
      "--no-save",
      peer.range,
      `file:${coreTgz}`,
      `file:${adapterTgz}`,
    ], { cwd: dir, env: { ...process.env, npm_config_engine_strict: "false" } });
    const result = run("smoke", "node", ["smoke.mjs"], { cwd: dir });
    console.log(result.stdout.trim());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const coreDist = path.join(root, "packages/core/dist/index.mjs");
  const adapterDist = path.join(root, "packages/ai-sdk/dist/index.mjs");
  if (!existsSync(coreDist) || !existsSync(adapterDist)) {
    fail("build packages/core and packages/ai-sdk before running this matrix");
  }

  const tarballDir = mkdtempSync(path.join(os.tmpdir(), "ai-peer-tgz-"));
  try {
    const coreTgz = packPackage(
      "pack agent-inspect",
      path.join(root, "packages/core"),
      tarballDir,
    );
    const adapterTgz = packPackage(
      "pack @agent-inspect/ai-sdk",
      path.join(root, "packages/ai-sdk"),
      tarballDir,
    );

    const rows = [];
    for (const peer of PEERS) {
      try {
        runPeer(peer, coreTgz, adapterTgz);
        rows.push({ peer: peer.id, status: "pass", required: peer.required !== false });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (peer.required === false) {
          rows.push({
            peer: peer.id,
            status: "blocked",
            marker: peer.softBlockMarker ?? "BLOCKED",
            error: message,
          });
          console.warn(`[ai-sdk-peer-matrix] ${peer.id} soft-blocked: ${message}`);
        } else {
          rows.push({
            peer: peer.id,
            status: "fail",
            error: message,
          });
        }
      }
    }

    const failed = rows.filter((row) => row.status === "fail");
    console.log(JSON.stringify({ matrix: rows }, null, 2));
    if (failed.length > 0) {
      fail(
        "peer matrix failures",
        failed.map((row) => `${row.peer}: ${row.error}`).join("\n"),
      );
    }
  } finally {
    rmSync(tarballDir, { recursive: true, force: true });
  }
}

main();
