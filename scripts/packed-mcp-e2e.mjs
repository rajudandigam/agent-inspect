/**
 * Packed MCP consumer E2E — verifies published wrapper shares the application
 * AgentInspect runtime (no split inspectRun context).
 * Run from repo root after build: node scripts/packed-mcp-e2e.mjs
 */
import { spawnSync } from "node:child_process";
import {
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
const mcpDir = path.join(root, "packages", "mcp");
const traceDirName = ".agent-inspect-runs";
const RUN_NAME = "mcp-packed-shared-runtime";

function fail(message, detail = "") {
  throw new Error(
    `[packed-mcp-e2e] ${message}${detail ? `\n${detail}` : ""}`,
  );
}

function spawnCli(command, args, options = {}) {
  const useShell =
    process.platform === "win32" && !command.toLowerCase().endsWith(".exe");
  const safeArgs = useShell
    ? args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))
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

function assertMcpBundleExternalizesAgentInspect() {
  const esm = readFileSync(path.join(mcpDir, "dist", "index.mjs"), "utf8");
  const cjs = readFileSync(path.join(mcpDir, "dist", "index.cjs"), "utf8");
  if (
    !/from\s+["']agent-inspect["']/.test(esm) &&
    !/import\(["']agent-inspect["']\)/.test(esm)
  ) {
    fail("MCP ESM bundle does not externalize agent-inspect import");
  }
  if (
    !/require\(["']agent-inspect["']\)/.test(cjs) &&
    !/from\s+["']agent-inspect["']/.test(cjs)
  ) {
    fail("MCP CJS bundle does not externalize agent-inspect require/import");
  }
  if (/function\s+inspectRun\b/.test(esm) || /function\s+createInspector\b/.test(esm)) {
    fail("MCP ESM bundle appears to embed an AgentInspect runtime");
  }
  if (/function\s+inspectRun\b/.test(cjs) || /function\s+createInspector\b/.test(cjs)) {
    fail("MCP CJS bundle appears to embed an AgentInspect runtime");
  }
}

function consumerScript(kind) {
  const isEsm = kind === "esm";
  const runName = isEsm ? RUN_NAME : `${RUN_NAME}-cjs`;
  const serverName = isEsm ? "packed-fixture" : "packed-fixture-cjs";
  const sdkRunName = isEsm ? `${RUN_NAME}-sdk` : `${RUN_NAME}-sdk-cjs`;
  const sdkServerName = isEsm ? "packed-sdk-fixture" : "packed-sdk-fixture-cjs";

  const importBlock = isEsm
    ? `import { inspectRun } from "agent-inspect";
import { wrapMcpClient } from "@agent-inspect/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";`
    : `const { inspectRun } = require("agent-inspect");
const { wrapMcpClient } = require("@agent-inspect/mcp");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { readdirSync, readFileSync } = require("node:fs");
const path = require("node:path");`;

  const body = `
${importBlock}

async function runMockClientTest({ warnings, originalWarn }) {
  const client = {
    async listTools() {
      return { tools: [{ name: "echo" }] };
    },
    async callTool({ name, arguments: args }) {
      if (name === "boom") {
        const err = new Error("mcp boom");
        err.code = "ETIMEDOUT";
        throw err;
      }
      return {
        content: [
          {
            type: "text",
            text: "ok:" + name + ":" + JSON.stringify(args ?? {}),
          },
        ],
      };
    },
  };
  const wrapped = wrapMcpClient(client, { serverName: ${JSON.stringify(serverName)} });

  const result = await inspectRun(${JSON.stringify(runName)}, async () => {
    const listed = await wrapped.listTools();
    const called = await wrapped.callTool({ name: "echo", arguments: { n: 1 } });
    return { listed, called };
  }, { traceDir: ${JSON.stringify(traceDirName)}, silent: true });

  if (!result.listed?.tools?.some((t) => t.name === "echo")) {
    throw new Error("mock listTools return value not preserved");
  }
  if (!JSON.stringify(result.called).includes("ok:echo")) {
    throw new Error("mock callTool return value not preserved");
  }

  let thrown;
  try {
    await inspectRun("mcp-packed-throw", async () => {
      await wrapped.callTool({ name: "boom", arguments: {} });
    }, { traceDir: ${JSON.stringify(traceDirName)}, silent: true });
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof Error) || thrown.message !== "mcp boom") {
    throw new Error("mock thrown application error was not preserved");
  }

  const files = readdirSync(${JSON.stringify(traceDirName)}).filter((f) => f.endsWith(".jsonl"));
  if (files.length === 0) {
    throw new Error("no JSONL traces written under mock inspectRun");
  }
  const lines = files.flatMap((f) =>
    readFileSync(path.join(${JSON.stringify(traceDirName)}, f), "utf8")
      .split("\\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  );
  const runEvent = lines.find(
    (event) =>
      event &&
      event.name === ${JSON.stringify(runName)} &&
      typeof event.runId === "string",
  );
  if (!runEvent?.runId) {
    throw new Error("application run event missing from persisted trace");
  }
  const mcpUnderRun = lines.filter(
    (event) =>
      event &&
      event.runId === runEvent.runId &&
      typeof event.name === "string" &&
      (event.name === "mcp:tools/list" || event.name === "mcp:echo"),
  );
  if (mcpUnderRun.length < 2) {
    throw new Error(
      "MCP mock steps were not persisted under the application inspectRun (shared runtime failed)",
    );
  }
}

async function runRealSdkClientTest() {
  const server = new Server(
    { name: "packed-sdk-test-server", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "echo",
        description: "Echoes input text",
        inputSchema: {
          type: "object",
          properties: { text: { type: "string" } },
        },
      },
      {
        name: "fail-tool",
        description: "Returns an application tool failure",
        inputSchema: { type: "object" },
      },
      {
        name: "throw-tool",
        description: "Throws an unhandled server error",
        inputSchema: { type: "object" },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "echo") {
      return {
        content: [
          {
            type: "text",
            text: "real-sdk-echo:" + JSON.stringify(args ?? {}),
          },
        ],
      };
    }
    if (name === "fail-tool") {
      return {
        content: [{ type: "text", text: "tool returned error" }],
        isError: true,
      };
    }
    if (name === "throw-tool") {
      throw new Error("unhandled server tool crash");
    }
    throw new Error("unknown tool: " + name);
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const rawClient = new Client(
    { name: "packed-real-sdk-client", version: "1.0.0" },
    { capabilities: {} },
  );

  const wrapped = wrapMcpClient(rawClient, {
    serverName: ${JSON.stringify(sdkServerName)},
    metadata: {
      operationId: "op-sdk-packed",
      attemptId: "att-sdk-1",
    },
  });

  if (!(wrapped instanceof Client)) {
    throw new Error("wrapped client is not an instance of SDK Client");
  }

  await wrapped.connect(clientTransport);
  await wrapped.ping();

  const sdkResult = await inspectRun(${JSON.stringify(sdkRunName)}, async () => {
    const listed = await wrapped.listTools();
    const echoed = await wrapped.callTool({
      name: "echo",
      arguments: { greeting: "hello from sdk" },
    });
    const failed = await wrapped.callTool({
      name: "fail-tool",
      arguments: {},
    });
    return { listed, echoed, failed };
  }, { traceDir: ${JSON.stringify(traceDirName)}, silent: true });

  if (!sdkResult.listed?.tools?.some((t) => t.name === "echo")) {
    throw new Error("real SDK listTools did not return echo tool");
  }
  if (!JSON.stringify(sdkResult.echoed).includes("hello from sdk")) {
    throw new Error("real SDK callTool echo content mismatch");
  }
  if (sdkResult.failed?.isError !== true) {
    throw new Error("real SDK callTool fail-tool isError flag was not preserved");
  }

  let sdkThrown;
  try {
    await inspectRun(${JSON.stringify(`${sdkRunName}-throw`)}, async () => {
      await wrapped.callTool({ name: "throw-tool", arguments: {} });
    }, { traceDir: ${JSON.stringify(traceDirName)}, silent: true });
  } catch (error) {
    sdkThrown = error;
  }
  if (!(sdkThrown instanceof Error) || !/unhandled server tool crash/.test(sdkThrown.message)) {
    throw new Error("real SDK unhandled server crash was not propagated");
  }

  await wrapped.close();
  await server.close();

  const files = readdirSync(${JSON.stringify(traceDirName)}).filter((f) => f.endsWith(".jsonl"));
  const lines = files.flatMap((f) =>
    readFileSync(path.join(${JSON.stringify(traceDirName)}, f), "utf8")
      .split("\\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  );

  const sdkRunEvent = lines.find(
    (event) =>
      event &&
      event.name === ${JSON.stringify(sdkRunName)} &&
      typeof event.runId === "string",
  );
  if (!sdkRunEvent?.runId) {
    throw new Error("real SDK inspectRun event missing from persisted trace");
  }

  const sdkToolEvents = lines.filter(
    (event) =>
      event &&
      event.runId === sdkRunEvent.runId &&
      typeof event.name === "string" &&
      (event.name === "mcp:tools/list" ||
        event.name === "mcp:echo" ||
        event.name === "mcp:fail-tool"),
  );
  if (sdkToolEvents.length < 3) {
    throw new Error(
      "real SDK MCP steps were not persisted under the application inspectRun (expected at least 3 steps, found " +
        sdkToolEvents.length +
        ")",
    );
  }

  const echoStep = sdkToolEvents.find(
    (event) => event.event === "step_started" && event.name === "mcp:echo",
  );
  if (
    !echoStep?.metadata ||
    echoStep.metadata.operationId !== "op-sdk-packed" ||
    echoStep.metadata.attemptId !== "att-sdk-1"
  ) {
    throw new Error(
      "real SDK step metadata (operationId/attemptId) not properly linked in trace: " +
        JSON.stringify(echoStep),
    );
  }
  if (echoStep.metadata.mcpServerName !== ${JSON.stringify(sdkServerName)}) {
    throw new Error("real SDK step mcpServerName metadata mismatch");
  }
}

async function main() {
  process.env.AGENT_INSPECT_TRACE_DIR = ${JSON.stringify(traceDirName)};
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.map(String).join(" "));
    originalWarn(...args);
  };

  try {
    await runMockClientTest({ warnings, originalWarn });
    await runRealSdkClientTest();
  } finally {
    console.warn = originalWarn;
  }

  const outside = warnings.filter((w) => /outside inspectRun/i.test(w));
  if (outside.length > 0) {
    throw new Error("outside-context warning emitted: " + outside.join(" | "));
  }

  console.log(${JSON.stringify(`[packed-mcp-e2e] ${kind.toUpperCase()} OK (mock + real SDK Client)`)});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
  return body;
}

const tarballDir = mkdtempSync(path.join(os.tmpdir(), "ai-mcp-pack-"));
const consumerDir = mkdtempSync(path.join(os.tmpdir(), "ai-mcp-consumer-"));

try {
  assertMcpBundleExternalizesAgentInspect();

  const rootTarball = packPackage("root package pack", root, tarballDir);
  const mcpTarball = packPackage("mcp package pack", mcpDir, tarballDir);

  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify({ name: "packed-mcp-consumer", private: true, type: "module" }),
  );

  run(
    "packed consumer install",
    "npm",
    ["install", "--ignore-scripts", rootTarball, mcpTarball, "@modelcontextprotocol/sdk@^1.29.0"],
    { cwd: consumerDir },
  );

  const esmScript = path.join(consumerDir, "run-esm.mjs");
  const cjsScript = path.join(consumerDir, "run-cjs.cjs");
  writeFileSync(esmScript, consumerScript("esm"));
  writeFileSync(cjsScript, consumerScript("cjs"));

  run("ESM packed MCP shared runtime", process.execPath, [esmScript], {
    cwd: consumerDir,
  });
  run("CJS packed MCP shared runtime", process.execPath, [cjsScript], {
    cwd: consumerDir,
  });

  console.log(
    "[packed-mcp-e2e] OK: external agent-inspect + packed ESM/CJS share inspectRun context with real SDK Client",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(tarballDir, { recursive: true, force: true });
  rmSync(consumerDir, { recursive: true, force: true });
}

