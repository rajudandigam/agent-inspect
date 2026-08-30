/**
 * Packed AI SDK no-key consumer E2E.
 * Run from repo root after build: node scripts/packed-ai-sdk-e2e.mjs
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
const adapterDir = path.join(root, "packages", "ai-sdk");
const traceDirName = ".agent-inspect-runs";
const AI_SDK_RUN_NAME = "ai-sdk-packed-fixture";
const AI_SDK_EXPECTED_PERSISTED_FACTS = [
  AI_SDK_RUN_NAME,
  "@agent-inspect/ai-sdk",
  "fixture-provider",
  "fixture-generate",
];
const AI_SDK_EXPECTED_VIEW_FACTS = [
  AI_SDK_RUN_NAME,
  "ai-sdk-step-0",
  "llm",
];
const AI_SDK_FORBIDDEN_FACTS = [
  "packed fixture prompt",
  "packed fixture answer",
];

function fail(message, detail = "") {
  throw new Error(
    `[packed-ai-sdk-e2e] ${message}${detail ? `\n${detail}` : ""}`,
  );
}

// npm/pnpm and .bin entries are cmd shims on Windows.
function spawnCli(command, args, options = {}) {
  const useShell =
    process.platform === "win32" && !command.toLowerCase().endsWith(".exe");
  const safeArgs = useShell
    ? args.map((arg) => (/[\s&|<>()^]/.test(arg) ? `"${arg}"` : arg))
    : args;
  return spawnSync(command, safeArgs, {
    encoding: "utf8",
    shell: useShell,
    ...options,
  });
}

function run(label, command, args, options = {}) {
  const result = spawnCli(command, args, options);
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
  const created = readdirSync(tarballDir).filter(
    (file) => file.endsWith(".tgz") && !before.has(file),
  );
  if (created.length !== 1) {
    fail(`${label} did not produce exactly one new tarball`, created.join(", "));
  }
  return path.join(tarballDir, created[0]);
}

function parseJson(label, output) {
  try {
    return JSON.parse(output);
  } catch (error) {
    fail(`${label} did not emit valid JSON`, `${error}\n${output}`);
  }
}

function installPackedConsumer(consumerDir, packageSpecs) {
  run(
    "packed consumer install",
    "npm",
    ["install", "--ignore-scripts", ...packageSpecs],
    { cwd: consumerDir },
  );
}

function resolvePackedCli(consumerDir) {
  const bin = path.join(consumerDir, "node_modules", ".bin", "agent-inspect");
  if (!existsSync(bin)) fail("packed CLI binary missing after install");
  return bin;
}

function readRunsFromListJson(json) {
  const runs = Array.isArray(json) ? json : json?.runs;
  if (!Array.isArray(runs)) {
    fail("packed CLI list --json emitted an unsupported run collection");
  }
  return runs;
}

function selectSingleRun(runs, predicate, failureLabel) {
  const matches = runs.filter(predicate);
  if (matches.length !== 1) {
    fail(
      `${failureLabel}: expected exactly one matching run, found ${matches.length}`,
      JSON.stringify(runs, null, 2),
    );
  }
  return matches[0];
}

function runPackedList(bin, traceDir, options) {
  const result = run(
    "packed CLI list --json",
    bin,
    ["list", "--dir", traceDir, "--json"],
    options,
  );
  return readRunsFromListJson(parseJson("packed CLI list --json", result.stdout));
}

function runPackedView(bin, runId, traceDir, options) {
  const result = run(
    "packed CLI view --json",
    bin,
    ["view", runId, "--dir", traceDir, "--json"],
    options,
  );
  return parseJson("packed CLI view --json", result.stdout);
}

function readPackedTrace(consumerDir, traceDir, runId) {
  return readFileSync(path.join(consumerDir, traceDir, `${runId}.jsonl`), "utf8");
}

function assertSerializedIncludes(label, serialized, expectedFacts) {
  for (const expected of expectedFacts) {
    if (!serialized.includes(expected)) {
      fail(`${label} is missing ${expected}`, serialized);
    }
  }
}

function assertSerializedExcludes(label, serialized, forbiddenFacts) {
  for (const forbidden of forbiddenFacts) {
    if (serialized.includes(forbidden)) {
      fail(`${label} unexpectedly includes ${forbidden}`, serialized);
    }
  }
}

function readAiSdkPeerRange() {
  const manifest = parseJson(
    "@agent-inspect/ai-sdk package.json",
    readFileSync(path.join(adapterDir, "package.json"), "utf8"),
  );
  const peerRange = manifest.peerDependencies?.ai;
  if (typeof peerRange !== "string" || peerRange.trim() === "") {
    fail("@agent-inspect/ai-sdk has no supported ai peer range");
  }
  return peerRange;
}

function withoutAiProviderCredentials() {
  const env = { ...process.env, AGENT_INSPECT_SILENT: "true" };
  for (const name of [
    "ANTHROPIC_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "COHERE_API_KEY",
    "DEEPSEEK_API_KEY",
    "FIREWORKS_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GROQ_API_KEY",
    "MISTRAL_API_KEY",
    "OPENAI_API_KEY",
    "TOGETHER_AI_API_KEY",
    "XAI_API_KEY",
  ]) {
    delete env[name];
  }
  return env;
}

function writeAiSdkConsumerFixture(consumerDir) {
  const consumerScript = path.join(consumerDir, "capture.mjs");
  writeFileSync(
    consumerScript,
    `import { generateText } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { agentInspect } from "@agent-inspect/ai-sdk";

const integration = agentInspect({
  traceDir: ${JSON.stringify(traceDirName)},
  runName: ${JSON.stringify(AI_SDK_RUN_NAME)},
  capture: "metadata-only",
});

const result = await generateText({
  model: new MockLanguageModelV3({
    provider: "fixture-provider",
    modelId: "fixture-generate",
    doGenerate: {
      content: [{ type: "text", text: "packed fixture answer" }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 4, noCache: 4, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 3, text: 3, reasoning: 0 },
      },
      response: {
        id: "fixture-generate-response",
        modelId: "fixture-generate",
        timestamp: new Date("2026-08-29T00:00:00.000Z"),
      },
      warnings: [],
    },
  }),
  prompt: "packed fixture prompt",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [integration],
  },
});

if (result.text !== "packed fixture answer") {
  throw new Error(\`unexpected mock result: \${result.text}\`);
}

await integration.flush();
await integration.close();

const diagnostics = integration.getDiagnostics();
if (
  diagnostics.writeFailures ||
  diagnostics.lifecycleWarnings ||
  diagnostics.flushFailures ||
  diagnostics.closeFailures
) {
  throw new Error(\`unexpected integration diagnostics: \${JSON.stringify(diagnostics)}\`);
}
`,
  );
  return consumerScript;
}

const peerRange = readAiSdkPeerRange();
const tarballDir = mkdtempSync(path.join(os.tmpdir(), "agent-inspect-ai-sdk-pack-"));
const consumerDir = mkdtempSync(
  path.join(os.tmpdir(), "agent-inspect-ai-sdk-consumer-"),
);

try {
  const rootTarball = packPackage("root package pack", root, tarballDir);
  const adapterTarball = packPackage("AI SDK adapter pack", adapterDir, tarballDir);

  writeFileSync(
    path.join(consumerDir, "package.json"),
    `${JSON.stringify(
      {
        name: "agent-inspect-ai-sdk-packed-smoke",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
  );

  installPackedConsumer(consumerDir, [
    rootTarball,
    adapterTarball,
    `ai@${peerRange}`,
  ]);

  const consumerScript = writeAiSdkConsumerFixture(consumerDir);
  const installedAiVersion = parseJson(
    "installed ai package.json",
    readFileSync(path.join(consumerDir, "node_modules", "ai", "package.json"), "utf8"),
  ).version;
  const runtimeEnv = withoutAiProviderCredentials();
  run(`AI SDK ${installedAiVersion} mock capture`, process.execPath, [consumerScript], {
    cwd: consumerDir,
    env: runtimeEnv,
  });

  const bin = resolvePackedCli(consumerDir);
  const commandOptions = { cwd: consumerDir, env: runtimeEnv };
  const runs = runPackedList(bin, traceDirName, commandOptions);
  const selectedRun = selectSingleRun(
    runs,
    (run) => run?.name === AI_SDK_RUN_NAME,
    "AI SDK run discovery",
  );
  if (typeof selectedRun.runId !== "string" || selectedRun.runId.trim() === "") {
    fail("AI SDK run discovery returned no runId", JSON.stringify(selectedRun));
  }

  const viewJson = runPackedView(
    bin,
    selectedRun.runId,
    traceDirName,
    commandOptions,
  );
  const serializedView = JSON.stringify(viewJson);
  assertSerializedIncludes(
    "packed CLI view --json",
    serializedView,
    [selectedRun.runId, ...AI_SDK_EXPECTED_VIEW_FACTS],
  );

  const persistedTrace = readPackedTrace(
    consumerDir,
    traceDirName,
    selectedRun.runId,
  );
  assertSerializedIncludes(
    "persisted AI SDK trace",
    persistedTrace,
    AI_SDK_EXPECTED_PERSISTED_FACTS,
  );
  assertSerializedExcludes(
    "persisted AI SDK trace",
    persistedTrace,
    AI_SDK_FORBIDDEN_FACTS,
  );

  console.log(
    "[packed-ai-sdk-e2e] OK: pack -> install -> mock generateText -> capture -> list -> view",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(tarballDir, { recursive: true, force: true });
  rmSync(consumerDir, { recursive: true, force: true });
}
