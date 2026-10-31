/**
 * Packed MCP consumer E2E with a real `@modelcontextprotocol/sdk` Client
 * (#488 / Mikhail). Plain-object fakes do not prove Proxy/prototype bounds.
 * Tool-result `isError` persistence lives here (the shape from johnnylemonny
 * in #494) so the mock harness stays a single script and does not grow a
 * second packed SDK consumer.
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
  CallToolResultSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";`
    : `const { inspectRun, observeOutcome } = require("agent-inspect");
const { wrapMcpClient } = require("@agent-inspect/mcp");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResultSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { mkdirSync, readdirSync, readFileSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");`;

  return `${importBlock}

const results = [];
function check(id, expected, observed) {
  results.push({ id, expected, observed });
  console.log("  " + id + ": expected=" + expected + " observed=" + observed);
}

async function createLinked(options = {}) {
  let callCount = 0;
  const failEchoTimes = options.failEchoTimes ?? 0;
  const slowEchoMs = options.slowEchoMs ?? 0;
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
      {
        name: "fail",
        description: "returns isError",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "slow",
        description: "slow then ok",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    callCount += 1;
    if (req.params.name === "boom") {
      throw new Error("mcp boom");
    }
    if (req.params.name === "fail") {
      return {
        content: [{ type: "text", text: "tool-private-sentence" }],
        isError: true,
      };
    }
    if (req.params.name === "slow" || (req.params.name === "echo" && slowEchoMs > 0)) {
      await new Promise((r) => setTimeout(r, slowEchoMs || 80));
    }
    if (req.params.name === "echo" && callCount <= failEchoTimes) {
      const err = new Error("429 Too Many Requests");
      err.code = "HTTP_429";
      err.status = 429;
      throw err;
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
    const sdkServerName = "packed-sdk-" + ${JSON.stringify(kind)};
    const runName = "mcp-sdk-" + ${JSON.stringify(kind)};
    const wrapped = wrapMcpClient(client, {
      serverName: sdkServerName,
    });
    if (!(wrapped instanceof Client)) {
      throw new Error("Proxy lost instanceof Client");
    }
    if (typeof wrapped.close !== "function" || typeof wrapped.connect !== "function") {
      throw new Error("prototype methods missing after wrap");
    }
    if (typeof wrapped.ping !== "function") {
      throw new Error("prototype ping missing after wrap");
    }
    // Receiver-binding probe: ping is not step-wrapped; must keep SDK this-binding.
    await wrapped.ping();

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnings.push(args.map(String).join(" "));
      originalWarn(...args);
    };
    let appResult;
    try {
      appResult = await inspectRun(
        runName,
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
    } finally {
      console.warn = originalWarn;
    }

    const outside = warnings.filter((w) => /outside inspectRun/i.test(w));
    if (outside.length > 0) {
      throw new Error(
        "outside-context warning emitted during M01/M02 run: " + outside.join(" | "),
      );
    }
    check(
      "M01b-zero-outside-warnings-" + ${JSON.stringify(kind)},
      "pass",
      "pass",
    );

    const listOk = appResult.listed?.tools?.some((t) => t.name === "echo");
    const callOk = JSON.stringify(appResult.called).includes("ok:echo");
    check(
      ${JSON.stringify(kind === "esm" ? "M01-esm-real-client" : "M02-cjs-real-client")},
      "pass",
      listOk && callOk ? "pass" : "fail",
    );

    // Reopen saved JSONL for this physical run only (not substring / other runs).
    const m01Files = readdirSync(${JSON.stringify(traceDirName)}).filter((f) =>
      f.endsWith(".jsonl"),
    );
    if (m01Files.length === 0) {
      throw new Error("no JSONL traces written under M01/M02 inspectRun");
    }
    const m01Lines = m01Files.flatMap((f) =>
      readFileSync(path.join(${JSON.stringify(traceDirName)}, f), "utf8")
        .split("\\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    );
    const runStarted = m01Lines.find(
      (e) => e && e.event === "run_started" && e.name === runName,
    );
    if (!runStarted?.runId) {
      throw new Error("M01/M02 run_started missing for " + runName);
    }
    const runId = runStarted.runId;
    const inRun = m01Lines.filter((e) => e && e.runId === runId);
    const listStep = inRun.find(
      (e) => e.event === "step_started" && e.name === "mcp:tools/list",
    );
    if (!listStep) {
      throw new Error(
        "mcp:tools/list step_started missing under runId " + runId,
      );
    }
    if (listStep.metadata?.mcpServerName !== sdkServerName) {
      throw new Error(
        "mcpServerName mismatch on mcp:tools/list: got " +
          JSON.stringify(listStep.metadata?.mcpServerName) +
          " expected " +
          JSON.stringify(sdkServerName),
      );
    }
    check(
      "M01c-saved-tools-list-" + ${JSON.stringify(kind)},
      "pass",
      "pass",
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

    // Persisted semantic failure for an SDK isError result (#494 shape).
    // Transport success stays a successful step; the failed outcome is the fact.
    const failed = await inspectRun(
      "mcp-sdk-tool-error-" + ${JSON.stringify(kind)},
      async () =>
        wrapped.callTool(
          { name: "fail", arguments: {} },
          undefined,
          { metadata: { operationId: "op-fail", attemptId: "1" } },
        ),
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
    const toolStep = lines.find(
      (event) => event && event.event === "step_started" && event.name === "mcp:fail",
    );
    const completed = lines.find(
      (event) =>
        event &&
        event.event === "step_completed" &&
        event.stepId === toolStep?.stepId,
    );
    const outcome = lines.find(
      (event) => event && event.event === "outcome_observed" && event.status === "failed",
    );
    const toolErrorOk =
      failed?.isError === true &&
      completed?.status === "success" &&
      outcome?.parentId === toolStep?.stepId &&
      outcome?.evidence?.toolFailure === true &&
      outcome?.evidence?.toolName === "fail" &&
      outcome?.evidence?.operationId === "op-fail" &&
      outcome?.evidence?.attemptId === "1" &&
      !JSON.stringify(outcome ?? {}).includes("tool-private-sentence");
    check(
      "M13-tool-error-persisted-" + ${JSON.stringify(kind)},
      "pass",
      toolErrorOk ? "pass" : "fail",
    );

    // M08: close/flush bounded — no throw; idle close is not failure
    await wrapped.close();
    await server.close();
    check("M08-close-bounded-" + ${JSON.stringify(kind)}, "pass", "pass");
  }

  // M03: real 429 → fake-clock delay → success at CallTool boundary (not a predefined array)
  {
    let fakeNow = 0;
    const clock = {
      now: () => fakeNow,
      advance: (ms) => {
        fakeNow += ms;
      },
    };
    const { client, server, getCallCount } = await createLinked({ failEchoTimes: 1 });
    const wrapped = wrapMcpClient(client, {
      serverName: "retry-429",
      toolCallIdPrefix: "r429",
    });
    const journal = [];
    const appResult = await inspectRun(
      "mcp-sdk-429-" + ${JSON.stringify(kind)},
      async () => {
        try {
          await wrapped.callTool(
            { name: "echo", arguments: { n: 1 } },
            {
              metadata: {
                operationId: "op-echo",
                attemptId: "a1",
                attemptNumber: 1,
                httpStatus: 429,
                terminal: "retryable",
              },
            },
          );
          journal.push({ attemptId: "a1", ok: true });
        } catch (error) {
          journal.push({
            attemptId: "a1",
            ok: false,
            status: error?.status ?? 429,
            message: String(error?.message ?? error),
            boundary: "CallToolRequestSchema→client.callTool",
            observedAt: clock.now(),
          });
          const delayMs = 25;
          clock.advance(delayMs);
          journal.push({
            selectedDelayMs: delayMs,
            delaySource: "fake-clock",
            observedAt: clock.now(),
          });
          const ok = await wrapped.callTool(
            { name: "echo", arguments: { n: 1 } },
            {
              metadata: {
                operationId: "op-echo",
                attemptId: "a2",
                attemptNumber: 2,
                retryOf: "a1",
                httpStatus: 200,
                terminal: "success",
              },
            },
          );
          journal.push({ attemptId: "a2", ok: true, text: JSON.stringify(ok) });
          return ok;
        }
        throw new Error("expected first echo to fail with 429");
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
    const attempts = lines.filter(
      (e) =>
        e &&
        e.event === "step_started" &&
        e.name === "mcp:echo" &&
        (e.metadata?.operationId === "op-echo" ||
          e.metadata?.attemptId === "a1" ||
          e.metadata?.attemptId === "a2"),
    );
    const hasRetryLink = lines.some(
      (e) => e && e.metadata?.attemptId === "a2" && e.metadata?.retryOf === "a1",
    );
    const m03ok =
      journal.some((j) => j.attemptId === "a1" && j.ok === false) &&
      journal.some((j) => j.selectedDelayMs === 25) &&
      journal.some((j) => j.attemptId === "a2" && j.ok === true) &&
      getCallCount() >= 2 &&
      hasRetryLink &&
      appResult != null;
    check(
      "M03-429-retry-boundary-" + ${JSON.stringify(kind)},
      "pass",
      m03ok ? "pass" : "fail",
    );
    await wrapped.close();
    await server.close();
  }

  // M04: cancel in-flight slow tool via close; caller error + cleanup (not idle-only close)
  {
    const { client, server } = await createLinked({ slowEchoMs: 200 });
    const wrapped = wrapMcpClient(client, { serverName: "cancel-inflight" });
    let callerError = null;
    let settled = false;
    await inspectRun(
      "mcp-sdk-cancel-" + ${JSON.stringify(kind)},
      async () => {
        const pending = wrapped.callTool({ name: "slow", arguments: {} }).then(
          (v) => {
            settled = true;
            return v;
          },
          (err) => {
            callerError = err;
            settled = true;
            throw err;
          },
        );
        await new Promise((r) => setTimeout(r, 20));
        await wrapped.close();
        try {
          await pending;
        } catch {
          /* expected after cancel/close */
        }
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    await server.close().catch(() => {});
    const m04ok = settled === true && callerError != null;
    check(
      "M04-cancel-close-" + ${JSON.stringify(kind)},
      "pass",
      m04ok ? "pass" : "fail",
    );
  }

  // M05: overlapping calls — distinct toolCallIds AND per-call result isolation
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, {
      serverName: "overlap",
      toolCallIdPrefix: "ov",
    });
    let resultsOverlap;
    await inspectRun(
      "mcp-sdk-overlap-" + ${JSON.stringify(kind)},
      async () => {
        resultsOverlap = await Promise.all([
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
    const texts = (resultsOverlap ?? []).map((r) => JSON.stringify(r));
    const isolated =
      texts.length === 2 &&
      texts[0] !== texts[1] &&
      texts.some((t) => t.includes('"n":1') || t.includes(":1")) &&
      texts.some((t) => t.includes('"n":2') || t.includes(":2"));
    check(
      "M05-overlap-distinct-ids-" + ${JSON.stringify(kind)},
      "pass",
      echoStarts.length >= 2 && ids.size >= 2 && isolated ? "pass" : "fail",
    );
    await wrapped.close();
    await server.close();
  }

  // M06: missing-readiness vs healthy-idle vs EOF — distinct observations
  {
    const unreadyClient = new Client({ name: "unready", version: "1.0.0" });
    let unreadyThrew = false;
    try {
      await unreadyClient.listTools();
    } catch {
      unreadyThrew = true;
    }
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "lifecycle" });
    let readiness = "unknown";
    let idleHealthy = false;
    await inspectRun(
      "mcp-sdk-lifecycle-" + ${JSON.stringify(kind)},
      async () => {
        await wrapped.listTools();
        readiness = "ready";
        idleHealthy = true;
        await observeOutcome("mcp-readiness", {
          expectation: "Client connected and listed tools",
          status: "passed",
          method: "custom",
          evidence: {
            readiness,
            idleHealthy,
            missingReadinessObserved: unreadyThrew,
            eofIsNotReadinessFailure: true,
          },
        });
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    await wrapped.close();
    let eofAfterClose = false;
    try {
      await client.listTools();
    } catch {
      eofAfterClose = true;
    }
    await server.close();
    const m06ok =
      unreadyThrew &&
      readiness === "ready" &&
      idleHealthy &&
      eofAfterClose;
    check(
      "M06-readiness-not-eof-" + ${JSON.stringify(kind)},
      "pass",
      m06ok ? "pass" : "fail",
    );
  }

  // M09: RequestOptions parity — pre-aborted signal: reject + zero server calls
  // (raw Client ≡ wrapMcpClient). Must not drop the third SDK argument.
  {
    async function runPreAbort(useWrap) {
      let serverCalls = 0;
      const server = new Server(
        { name: "opts-probe", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );
      server.setRequestHandler(CallToolRequestSchema, async () => {
        serverCalls += 1;
        return { content: [{ type: "text", text: "executed" }] };
      });
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
          {
            name: "probe",
            description: "probe",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      }));
      const raw = new Client({ name: "opts-client", version: "1.0.0" });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(st), raw.connect(ct)]);
      const client = useWrap ? wrapMcpClient(raw) : raw;
      const controller = new AbortController();
      controller.abort(new Error("caller cancelled before request"));
      let status = "resolved";
      try {
        await client.callTool(
          { name: "probe", arguments: {} },
          undefined,
          { signal: controller.signal, timeout: 1000 },
        );
      } catch {
        status = "rejected";
      }
      await Promise.allSettled([raw.close(), server.close()]);
      return { status, serverCalls };
    }
    const control = await runPreAbort(false);
    const instrumented = await inspectRun(
      "mcp-sdk-preabort-" + ${JSON.stringify(kind)},
      async () => runPreAbort(true),
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    const m09ok =
      control.status === "rejected" &&
      control.serverCalls === 0 &&
      instrumented.status === "rejected" &&
      instrumented.serverCalls === 0;
    check(
      "M09-preabort-options-parity-" + ${JSON.stringify(kind)},
      "pass",
      m09ok ? "pass" : "fail",
    );
  }

  // M10: request timeout with controlled slow handler — bounded rejection matches raw SDK
  {
    async function runTimeout(useWrap) {
      const server = new Server(
        { name: "timeout-probe", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
          {
            name: "slow",
            description: "slow",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      }));
      server.setRequestHandler(CallToolRequestSchema, async () => {
        await new Promise((r) => setTimeout(r, 500));
        return { content: [{ type: "text", text: "late" }] };
      });
      const raw = new Client({ name: "timeout-client", version: "1.0.0" });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(st), raw.connect(ct)]);
      const client = useWrap ? wrapMcpClient(raw) : raw;
      let status = "resolved";
      try {
        await client.callTool(
          { name: "slow", arguments: {} },
          undefined,
          { timeout: 50 },
        );
      } catch {
        status = "rejected";
      }
      await Promise.allSettled([raw.close(), server.close()]);
      return status;
    }
    const rawStatus = await runTimeout(false);
    const wrapStatus = await inspectRun(
      "mcp-sdk-timeout-" + ${JSON.stringify(kind)},
      async () => runTimeout(true),
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    check(
      "M10-timeout-options-parity-" + ${JSON.stringify(kind)},
      "pass",
      rawStatus === "rejected" && wrapStatus === "rejected" ? "pass" : "fail",
    );
  }

  // M11: listTools options forwarded (timeout) — must not throw arity/shape errors
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "list-opts" });
    let listOk = false;
    await inspectRun(
      "mcp-sdk-list-opts-" + ${JSON.stringify(kind)},
      async () => {
        const listed = await wrapped.listTools({}, { timeout: 5000 });
        listOk = Array.isArray(listed?.tools) && listed.tools.length >= 1;
      },
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    await wrapped.close();
    await server.close();
    check(
      "M11-listTools-options-" + ${JSON.stringify(kind)},
      "pass",
      listOk ? "pass" : "fail",
    );
  }

  // M12: composed RequestOptions + AgentInspect metadata — timeout forwards AND
  // operationId/attemptId persist on the traced step (must not be mutually exclusive).
  {
    const composeDir = ${JSON.stringify(traceDirName)} + "-compose";
    mkdirSync(composeDir, { recursive: true });
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "compose-meta" });
    await inspectRun(
      "mcp-sdk-compose-meta-" + ${JSON.stringify(kind)},
      async () =>
        wrapped.callTool(
          { name: "echo", arguments: { n: 1 } },
          undefined,
          {
            timeout: 1000,
            metadata: { operationId: "op1", attemptId: "a1" },
          },
        ),
      { silent: true, traceDir: composeDir },
    );
    const files = readdirSync(composeDir).filter((f) => f.endsWith(".jsonl"));
    const lines = files.flatMap((f) =>
      readFileSync(path.join(composeDir, f), "utf8")
        .split("\\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    );
    const start = lines.find(
      (e) => e && e.event === "step_started" && e.name === "mcp:echo",
    );
    const m12ok =
      start?.metadata?.operationId === "op1" &&
      start?.metadata?.attemptId === "a1";
    check(
      "M12-compose-options-metadata-" + ${JSON.stringify(kind)},
      "pass",
      m12ok ? "pass" : "fail",
    );
    await wrapped.close();
    await server.close();
  }

  // M13: malformed SDK result — CallToolResultSchema rejects invalid content shape.
  // Raw and wrapped must both reject; wrapper must not swallow the SDK error.
  {
    async function runMalformed(useWrap) {
      const server = new Server(
        { name: "malformed-probe", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
          {
            name: "bad",
            description: "bad",
            inputSchema: { type: "object", properties: {} },
          },
        ],
      }));
      server.setRequestHandler(CallToolRequestSchema, async () => ({
        // Invalid: content must be an array of content blocks, not a string.
        content: "not-an-array",
      }));
      const raw = new Client({ name: "malformed-client", version: "1.0.0" });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(st), raw.connect(ct)]);
      const client = useWrap ? wrapMcpClient(raw) : raw;
      let status = "resolved";
      let message = "";
      try {
        await client.callTool(
          { name: "bad", arguments: {} },
          CallToolResultSchema,
        );
      } catch (error) {
        status = "rejected";
        message = String(error?.message ?? error);
      }
      await Promise.allSettled([raw.close(), server.close()]);
      return { status, message };
    }
    const control = await runMalformed(false);
    const instrumented = await inspectRun(
      "mcp-sdk-malformed-" + ${JSON.stringify(kind)},
      async () => runMalformed(true),
      { silent: true, traceDir: ${JSON.stringify(traceDirName)} },
    );
    const m13ok =
      control.status === "rejected" &&
      instrumented.status === "rejected";
    check(
      "M13-malformed-result-" + ${JSON.stringify(kind)},
      "pass",
      m13ok ? "pass" : "fail",
    );
  }

  // M14: instrumentation/persistence failure must not alter successful tool result.
  {
    const { client, server } = await createLinked();
    const wrapped = wrapMcpClient(client, { serverName: "instr-fail" });
    const badTrace = path.join(
      os.tmpdir(),
      "agent-inspect-mcp-not-dir-" + Date.now(),
    );
    writeFileSync(badTrace, "not-a-directory");
    let appResult = null;
    let threw = false;
    try {
      appResult = await inspectRun(
        "mcp-sdk-instr-fail-" + ${JSON.stringify(kind)},
        async () =>
          wrapped.callTool({ name: "echo", arguments: { n: 1 } }),
        { silent: true, traceDir: badTrace },
      );
    } catch {
      threw = true;
    }
    const m14ok =
      !threw &&
      appResult != null &&
      JSON.stringify(appResult).includes("ok:echo");
    check(
      "M14-instrumentation-isolates-" + ${JSON.stringify(kind)},
      "pass",
      m14ok ? "pass" : "fail",
    );
    await wrapped.close();
    await server.close();
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
    [
      "install",
      "--ignore-scripts",
      rootTarball,
      mcpTarball,
      SDK_PIN,
      "typescript@5.9.3",
    ],
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

  // Declaration consumers: strict tsc must accept wrapMcpClient(new Client(...)).
  // Runtime smoke only checks retained method shapes (no network/connect required).
  const mtsSource = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { wrapMcpClient } from "@agent-inspect/mcp";
const wrapped = wrapMcpClient(new Client({ name: "decl", version: "1" }));
const _call: typeof wrapped.callTool = wrapped.callTool;
const _list: typeof wrapped.listTools = wrapped.listTools;
const _close: typeof wrapped.close = wrapped.close;
void _call;
void _list;
void _close;
void wrapped.callTool;
void wrapped.listTools;
void wrapped.close;
console.log("mts-ok", typeof wrapped.callTool, typeof wrapped.close);
`;
  const ctsSource = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { wrapMcpClient } from "@agent-inspect/mcp";
const wrapped = wrapMcpClient(new Client({ name: "decl-cjs", version: "1" }));
const _call: typeof wrapped.callTool = wrapped.callTool;
const _list: typeof wrapped.listTools = wrapped.listTools;
const _close: typeof wrapped.close = wrapped.close;
void _call;
void _list;
void _close;
void wrapped.callTool;
void wrapped.listTools;
void wrapped.close;
console.log("cts-ok", typeof wrapped.callTool, typeof wrapped.close);
`;
  writeFileSync(path.join(consumerDir, "sdk-typecheck.mts"), mtsSource);
  writeFileSync(path.join(consumerDir, "sdk-typecheck.cts"), ctsSource);
  writeFileSync(
    path.join(consumerDir, "tsconfig.decl.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          skipLibCheck: true,
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: false,
          outDir: "decl-out",
          declaration: false,
        },
        include: ["sdk-typecheck.mts", "sdk-typecheck.cts"],
      },
      null,
      2,
    ),
  );
  run(
    "packed SDK declaration typecheck",
    path.join(consumerDir, "node_modules", ".bin", "tsc"),
    ["-p", "tsconfig.decl.json"],
    { cwd: consumerDir },
  );
  run("run compiled .mts consumer", process.execPath, [
    path.join(consumerDir, "decl-out", "sdk-typecheck.mjs"),
  ], { cwd: consumerDir });
  run("run compiled .cts consumer", process.execPath, [
    path.join(consumerDir, "decl-out", "sdk-typecheck.cjs"),
  ], { cwd: consumerDir });

  console.log(
    "[packed-mcp-sdk-e2e] OK: packed ESM/CJS + declaration consumers use real @modelcontextprotocol/sdk Client",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(tarballDir, { recursive: true, force: true });
  rmSync(consumerDir, { recursive: true, force: true });
}
