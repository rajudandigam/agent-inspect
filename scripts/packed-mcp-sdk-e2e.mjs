/**
 * Packed MCP consumer E2E with a real `@modelcontextprotocol/sdk` Client
 * (#488 / Mikhail). Plain-object fakes do not prove Proxy/prototype bounds.
 *
 * Run from repo root after build: node scripts/packed-mcp-sdk-e2e.mjs
 *
 * Keyless: InMemoryTransport only — no network, no AlphAI claim.
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
const SDK_PIN = "@modelcontextprotocol/sdk@1.31.0";
const traceDirName = ".agent-inspect-sdk-runs";

function fail(message, detail = "") {
  throw new Error(
    `[packed-mcp-sdk-e2e] ${message}${detail ? `\n${detail}` : ""}`,
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
  if (result.stdout?.trim()) process.stdout.write(result.stdout);
  if (result.stderr?.trim() && result.status !== 0) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    fail(
      `${label} failed`,
      `${result.error?.message ?? ""}\n${result.stdout || ""}\n${result.stderr || ""}`.trim(),
    );
  }
  return result;
}

function packPackage(label, packageDir, tarballDir, { rewriteWorkspace = false } = {}) {
  // Root has `prepack: pnpm run build` — always pack with npm --ignore-scripts.
  // MCP needs pnpm pack so workspace:* is rewritten to a concrete version.
  const before = new Set(readdirSync(tarballDir));
  if (rewriteWorkspace) {
    run(label, "pnpm", ["--dir", packageDir, "pack", "--pack-destination", tarballDir], {
      env: {
        ...process.env,
        npm_config_json: "false",
        NPM_CONFIG_JSON: "false",
      },
    });
  } else {
    run(
      label,
      "npm",
      ["pack", "--ignore-scripts", "--pack-destination", tarballDir],
      {
        cwd: packageDir,
        env: {
          ...process.env,
          npm_config_json: "false",
          NPM_CONFIG_JSON: "false",
        },
      },
    );
  }
  const created = readdirSync(tarballDir).filter(
    (file) => file.endsWith(".tgz") && !before.has(file),
  );
  if (created.length !== 1) {
    fail(`${label} did not produce exactly one new tarball`, created.join(", "));
  }
  return path.join(tarballDir, created[0]);
}

function consumerScript(kind) {
  const isEsm = kind === "esm";
  const importBlock = isEsm
    ? `import { inspectRun, observeOutcome } from "agent-inspect";
import { wrapMcpClient } from "@agent-inspect/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";`
    : `const { inspectRun, observeOutcome } = require("agent-inspect");
const { wrapMcpClient } = require("@agent-inspect/mcp");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { readdirSync, readFileSync } = require("node:fs");
const path = require("node:path");`;

  return `${importBlock}

const results = [];
function check(id, expected, observed) {
  results.push({ id, expected, observed });
  console.log("  " + id + ": expected=" + expected + " observed=" + observed);
}

async function createLinked() {
  let callCount = 0;
  const server = new Server(
    { name: "fixture-sdk", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "echo",
        description: "echo",
        inputSchema: { type: "object", properties: { n: { type: "number" } } },
      },
      {
        name: "boom",
        description: "throws",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    callCount += 1;
    if (req.params.name === "boom") {
      throw new Error("mcp boom");
    }
    return {
      content: [
        {
          type: "text",
          text:
            "ok:" +
            req.params.name +
            ":" +
            JSON.stringify(req.params.arguments ?? {}) +
            ":c" +
            callCount,
        },
      ],
    };
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "packed-consumer", version: "1.0.0" });
  await client.connect(clientTransport);
  return { client, server, getCallCount: () => callCount };
}

async function main() {
  process.env.AGENT_INSPECT_TRACE_DIR = ${JSON.stringify(traceDirName)};
  console.log("packed-mcp-sdk-" + ${JSON.stringify(kind)} + ":");
  const sdkPkgPath = path.join(
    process.cwd(),
    "node_modules",
    "@modelcontextprotocol",
    "sdk",
    "package.json",
  );
  const sdkVersion = JSON.parse(readFileSync(sdkPkgPath, "utf8")).version;
  console.log(
    "  versions: node=" +
      process.version +
      " sdk=" +
      sdkVersion +
      " (pin ${SDK_PIN})",
  );

  // M01/M02: real Client + Proxy preserves prototype/private path + shared inspectRun
  {
    const { client, server } = await createLinked();
    if (!(client instanceof Client)) throw new Error("not a real SDK Client");
    const wrapped = wrapMcpClient(client, {
      serverName: "packed-sdk-" + ${JSON.stringify(kind)},
    });
    if (!(wrapped instanceof Client)) {
      throw new Error("Proxy lost instanceof Client");
    }
    if (typeof wrapped.close !== "function" || typeof wrapped.connect !== "function") {
      throw new Error("prototype methods missing after wrap");
    }

    const appResult = await inspectRun(
      "mcp-sdk-" + ${JSON.stringify(kind)},
      async () => {
        const listed = await wrapped.listTools();
        const called = await wrapped.callTool({
          name: "echo",
          arguments: { n: 1 },
        });
        return { listed, called };
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );

    const listOk = appResult.listed?.tools?.some((t) => t.name === "echo");
    const callOk = JSON.stringify(appResult.called).includes("ok:echo");
    check(
      ${JSON.stringify(kind === "esm" ? "M01-esm-real-client" : "M02-cjs-real-client")},
      "pass",
      listOk && callOk ? "pass" : "fail",
    );

    // M07: application error preserved through wrapper
    let thrown;
    try {
      await inspectRun(
        "mcp-sdk-boom-" + ${JSON.stringify(kind)},
        async () => {
          await wrapped.callTool({ name: "boom", arguments: {} });
        },
        { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
      );
    } catch (error) {
      thrown = error;
    }
    const boomOk =
      thrown instanceof Error && /mcp boom/i.test(String(thrown.message));
    check("M07-error-preserved-" + ${JSON.stringify(kind)}, "pass", boomOk ? "pass" : "fail");

    // M08: close/flush bounded — no throw; idle close is not failure
    await wrapped.close();
    await server.close();
    check("M08-close-bounded-" + ${JSON.stringify(kind)}, "pass", "pass");
  }

  // M03: transport 429/retry is NOT auto-captured by wrapMcpClient — app must supply attempt IDs
  {
    const transportAttempts = [
      {
        operationId: "op-list",
        attemptId: "a1",
        attemptNumber: 1,
        httpStatus: 429,
        selectedDelayMs: 25,
        delaySource: "retry-after",
        terminal: "retryable",
      },
      {
        operationId: "op-list",
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
        httpStatus: 200,
        delaySource: "none",
        terminal: "success",
      },
    ];
    const wrapperSuccessDoesNotImplyTransport =
      transportAttempts.some((a) => a.httpStatus === 429) &&
      transportAttempts.some((a) => a.attemptId && a.retryOf);
    check(
      "M03-429-retry-boundary-" + ${JSON.stringify(kind)},
      "pass",
      wrapperSuccessDoesNotImplyTransport ? "pass" : "fail",
    );
  }

  // M04: cancellation via close while idle after connect (not a hang)
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "cancel-fixture" });
    await inspectRun(
      "mcp-sdk-cancel-" + ${JSON.stringify(kind)},
      async () => {
        await wrapped.listTools();
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    await wrapped.close();
    await server.close();
    check("M04-cancel-close-" + ${JSON.stringify(kind)}, "pass", "pass");
  }

  // M05: overlapping calls keep distinct toolCallIds under one run
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, {
      serverName: "overlap",
      toolCallIdPrefix: "ov",
    });
    await inspectRun(
      "mcp-sdk-overlap-" + ${JSON.stringify(kind)},
      async () => {
        await Promise.all([
          wrapped.callTool({ name: "echo", arguments: { n: 1 } }),
          wrapped.callTool({ name: "echo", arguments: { n: 2 } }),
        ]);
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    const files = readdirSync(${JSON.stringify(traceDirName)}).filter((f) =>
      f.endsWith(".jsonl"),
    );
    const lines = files.flatMap((f) =>
      readFileSync(path.join(${JSON.stringify(traceDirName)}, f), "utf8")
        .split("\\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    );
    const echoStarts = lines.filter(
      (e) => e && e.event === "step_started" && e.name === "mcp:echo",
    );
    const ids = new Set(
      echoStarts.map((e) => e.metadata?.toolCallId).filter(Boolean),
    );
    check(
      "M05-overlap-distinct-ids-" + ${JSON.stringify(kind)},
      "pass",
      echoStarts.length >= 2 && ids.size >= 2 ? "pass" : "fail",
    );
    await wrapped.close();
    await server.close();
  }

  // M06: readiness observed; healthy idle ≠ failure; EOF/close ≠ readiness
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "lifecycle" });
    let readiness = "unknown";
    await inspectRun(
      "mcp-sdk-lifecycle-" + ${JSON.stringify(kind)},
      async () => {
        await wrapped.listTools();
        readiness = "ready";
        await observeOutcome("mcp-readiness", {
          expectation: "Client connected and listed tools",
          status: "passed",
          method: "custom",
          evidence: { readiness, idleHealthy: true, eofIsNotReadiness: true },
        });
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    await wrapped.close();
    await server.close();
    check(
      "M06-readiness-not-eof-" + ${JSON.stringify(kind)},
      "pass",
      readiness === "ready" ? "pass" : "fail",
    );
  }

  const mismatch = results.filter((r) => r.expected !== r.observed);
  console.log(
    "classes: " +
      results.map((r) => r.id.replace(/-esm|-cjs/g, "") + ":" + r.observed).join(","),
  );
  if (mismatch.length) {
    console.error("classification mismatches", mismatch);
    process.exitCode = 1;
    return;
  }
  console.log("[packed-mcp-sdk-e2e] " + ${JSON.stringify(kind.toUpperCase())} + " OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
}

const tarballDir = mkdtempSync(path.join(os.tmpdir(), "ai-mcp-sdk-pack-"));
const consumerDir = mkdtempSync(path.join(os.tmpdir(), "ai-mcp-sdk-consumer-"));

try {
  const rootTarball = packPackage("root package pack", root, tarballDir, {
    rewriteWorkspace: false,
  });
  const mcpTarball = packPackage("mcp package pack", mcpDir, tarballDir, {
    rewriteWorkspace: true,
  });

  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify({
      name: "packed-mcp-sdk-consumer",
      private: true,
      type: "module",
    }),
  );

  run(
    "packed SDK consumer install",
    "npm",
    ["install", "--ignore-scripts", rootTarball, mcpTarball, SDK_PIN],
    { cwd: consumerDir },
  );

  const esmScript = path.join(consumerDir, "run-esm.mjs");
  const cjsScript = path.join(consumerDir, "run-cjs.cjs");
  writeFileSync(esmScript, consumerScript("esm"));
  writeFileSync(cjsScript, consumerScript("cjs"));

  run("ESM packed MCP real SDK", process.execPath, [esmScript], {
    cwd: consumerDir,
  });
  run("CJS packed MCP real SDK", process.execPath, [cjsScript], {
    cwd: consumerDir,
  });

  console.log(
    "[packed-mcp-sdk-e2e] OK: packed ESM/CJS consumers use real @modelcontextprotocol/sdk Client",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(tarballDir, { recursive: true, force: true });
  rmSync(consumerDir, { recursive: true, force: true });
}
