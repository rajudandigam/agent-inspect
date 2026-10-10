#!/usr/bin/env node
/**
 * F04 controlled OTLP identity evidence (Robb / Roy).
 * Captures real local runs, default OTLP export, mapping table.
 * Not Honeycomb/Refinery validation; not a shipped-release claim.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outRoot =
  process.argv[2] ??
  path.join(
    process.env.HOME ?? "",
    "Library/Application Support/Cursor/AgentStores/cursor_agent_stores/0b534b29-4d7a-426a-bfc9-a6732695828f/files/f04-otlp-robb-roy",
  );

const require = createRequire(path.join(root, "packages/core/package.json"));
const dist = path.join(root, "packages/core/dist");
const { inspectRun, step } = await import(path.join(dist, "index.mjs"));
const { exportOtlpJson, manualTraceEventsToRunTree } = await import(
  path.join(dist, "exporters.mjs")
);
const { openTraceFile } = await import(path.join(dist, "readers.mjs"));
const { getCurrentRunId } = await import(path.join(dist, "advanced.mjs"));

fs.mkdirSync(outRoot, { recursive: true });

async function capture(label, fn) {
  const traceDir = path.join(outRoot, "traces", label);
  fs.rmSync(traceDir, { recursive: true, force: true });
  fs.mkdirSync(traceDir, { recursive: true });
  let runId;
  await inspectRun(
    label,
    async () => {
      runId = getCurrentRunId();
      await fn();
    },
    { silent: true, traceDir },
  );
  const files = fs.readdirSync(traceDir).filter((f) => f.endsWith(".jsonl"));
  const sourcePath = path.join(traceDir, files[0]);
  const text = fs.readFileSync(sourcePath, "utf8");
  const events = text
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  const tree = manualTraceEventsToRunTree(events);
  const otlp = exportOtlpJson(tree);
  const otlpPath = path.join(outRoot, `${label}.default-otlp.json`);
  const jsonlCopy = path.join(outRoot, `${label}.source.jsonl`);
  fs.writeFileSync(jsonlCopy, text);
  fs.writeFileSync(otlpPath, otlp.content);
  const read = await openTraceFile(jsonlCopy);
  return { runId, sourcePath: jsonlCopy, otlpPath, events, otlp, read };
}

function toolAttempt(name, meta) {
  return step(
    name,
    async () => ({ ok: true }),
    { type: "tool", metadata: { toolName: name, ...meta } },
  );
}

// O01 Robb: one op, two attempts, a2 retryOf a1
const o01 = await capture("O01-robb-one-op-two-attempts", async () => {
  await step("logical-retrieve", async () => {
    await toolAttempt("retrieve_policy", {
      operationId: "op1",
      attemptId: "a1",
      attemptNumber: 1,
    });
    await toolAttempt("retrieve_policy", {
      operationId: "op1",
      attemptId: "a2",
      attemptNumber: 2,
      retryOf: "a1",
    });
  });
});

// O02 Roy: a1=429, a2=timeout, a3=success
const o02 = await capture("O02-roy-three-attempts", async () => {
  await toolAttempt("retrieve_policy", {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
    httpStatus: 429,
  });
  await toolAttempt("retrieve_policy", {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    retryOf: "a1",
    errorClass: "TIMEOUT",
  });
  await toolAttempt("retrieve_policy", {
    operationId: "op1",
    attemptId: "a3",
    attemptNumber: 3,
    retryOf: "a2",
  });
});

// O03 two operations × two attempts
const o03 = await capture("O03-two-ops-four-attempts", async () => {
  for (const op of ["op1", "op2"]) {
    await toolAttempt("retrieve_policy", {
      operationId: op,
      attemptId: `${op}-a1`,
      attemptNumber: 1,
    });
    await toolAttempt("retrieve_policy", {
      operationId: op,
      attemptId: `${op}-a2`,
      attemptNumber: 2,
      retryOf: `${op}-a1`,
    });
  }
});

// O04 second physical run reusing labels
const o04 = await capture("O04-second-physical-run", async () => {
  await toolAttempt("retrieve_policy", {
    operationId: "op1",
    attemptId: "a1",
    attemptNumber: 1,
  });
  await toolAttempt("retrieve_policy", {
    operationId: "op1",
    attemptId: "a2",
    attemptNumber: 2,
    retryOf: "a1",
  });
});

function identityAttrs(otlpContent) {
  const parsed = JSON.parse(otlpContent);
  const spans = parsed.resourceSpans?.[0]?.scopeSpans?.[0]?.spans ?? [];
  return spans.map((s) => {
    const attrs = Object.fromEntries(
      (s.attributes ?? []).map((a) => [
        a.key,
        a.value?.stringValue ?? a.value?.intValue ?? a.value,
      ]),
    );
    return {
      name: s.name,
      parentSpanId: s.parentSpanId ?? null,
      operationId: attrs["agent_inspect.operation_id"] ?? null,
      attemptId: attrs["agent_inspect.attempt_id"] ?? null,
      retryOf: attrs["agent_inspect.retry_of"] ?? null,
      attemptNumber: attrs["agent_inspect.attempt_number"] ?? null,
      runId: attrs["agent_inspect.run_id"] ?? null,
    };
  });
}

const mapping = {
  fieldMapping: {
    "source metadata.operationId": "attributes.agent_inspect.operation_id",
    "source metadata.attemptId": "attributes.agent_inspect.attempt_id",
    "source metadata.retryOf": "attributes.agent_inspect.retry_of",
    "source metadata.attemptNumber|attempt": "attributes.agent_inspect.attempt_number",
    "source parentId": "span.parentSpanId (hashed)",
    "source runId": "attributes.agent_inspect.run_id",
  },
  disclosureNote:
    "This restores emission of explicitly recorded identity fields as bounded structural OTLP attributes without includeAttributes. Treat as a compatibility/privacy review item before calling it a released default contract.",
  controls: {
    O01: identityAttrs(o01.otlp.content),
    O02: identityAttrs(o02.otlp.content),
    O03: identityAttrs(o03.otlp.content),
    O04: {
      runA: o01.runId,
      runB: o04.runId,
      distinctPhysicalRuns: o01.runId !== o04.runId,
      spans: identityAttrs(o04.otlp.content),
    },
  },
};

fs.writeFileSync(
  path.join(outRoot, "mapping-and-loss-table.json"),
  JSON.stringify(mapping, null, 2) + "\n",
);

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const sha = require("node:child_process")
  .execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" })
  .trim();

fs.writeFileSync(
  path.join(outRoot, "README.md"),
  `# F04 — OTLP identity pair (Robb) + conformance vector (Roy)

**Status:** local candidate evidence for maintainer review (not shipped; no Honeycomb claim).
**Package version string:** ${pkg.version}
**Source SHA:** ${sha}

## Commands

\`\`\`bash
pnpm build
node scripts/f04-otlp-identity-evidence.mjs
pnpm exec vitest run packages/core/test/exporters/otlp-json-exporter.test.ts
\`\`\`

## Robb (O01)

- \`O01-robb-one-op-two-attempts.source.jsonl\`
- \`O01-robb-one-op-two-attempts.default-otlp.json\`
- One logical parent \`logical-retrieve\`, child attempts a1/a2 with \`retryOf\`.

## Roy (O02)

- \`O02-roy-three-attempts.source.jsonl\` + default OTLP
- op1 with a1/a2/a3 attempt chain

## Mapping

See \`mapping-and-loss-table.json\`. Unknown identities remain absent (not fabricated).
Physical run ids for O01 vs O04 remain distinct when labels are reused.

## Privacy / contract

Default export now emits bounded \`agent_inspect.operation_id|attempt_id|retry_of|attempt_number\` when the source recorded them. This is **not** \`includeAttributes\`. Maintainer should confirm this as an accepted default disclosure before release notes claim a fixed contract.
`,
);

console.log(JSON.stringify({ outRoot, o01: o01.runId, o02: o02.runId, o04: o04.runId, distinct: o01.runId !== o04.runId }, null, 2));
