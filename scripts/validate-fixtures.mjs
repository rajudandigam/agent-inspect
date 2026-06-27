/**
 * Validate committed fixtures: required files, JSONL trace shape, config shape, no obvious secrets.
 * Run from repo root after `pnpm build` (imports `validateEvent` from core dist).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = {
  readmes: [
    "fixtures/README.md",
    "fixtures/traces/README.md",
    "fixtures/traces-v0.2/README.md",
    "fixtures/logs/README.md",
    "fixtures/configs/README.md",
  ],
  traces: [
    "fixtures/traces/minimal-success.jsonl",
    "fixtures/traces/minimal-error.jsonl",
    "fixtures/traces/nested-3-levels.jsonl",
    "fixtures/traces/parallel-siblings.jsonl",
    "fixtures/traces/llm-with-tokens.jsonl",
    "fixtures/traces/tool-with-io.jsonl",
    "fixtures/traces/long-running.jsonl",
    "fixtures/traces/error-recovery.jsonl",
    "fixtures/traces/dual-format-parity.jsonl",
  ],
  tracesV02: [
    "fixtures/traces-v0.2/manual-basic.jsonl",
    "fixtures/traces-v0.2/manual-tool-error.jsonl",
    "fixtures/traces-v0.2/log-derived-basic.jsonl",
    "fixtures/traces-v0.2/adapter-langchain-like.jsonl",
    "fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl",
    "fixtures/traces-v0.2/dual-format-parity.jsonl",
  ],
  tracesV10: [
    "fixtures/traces-v1.0/manual-basic.jsonl",
    "fixtures/traces-v1.0/manual-tool-error.jsonl",
    "fixtures/traces-v1.0/adapter-ai-sdk-like.jsonl",
    "fixtures/traces-v1.0/adapter-openai-agents-like.jsonl",
    "fixtures/traces-v1.0/otel-openinference-import.jsonl",
  ],
  logs: [
    "fixtures/logs/proactive-json.log",
    "fixtures/logs/proactive-log4js.log",
    "fixtures/logs/pino-agent-json.log",
    "fixtures/logs/log4js-agent-json.log",
    "fixtures/logs/nestjs-agent-json.log",
    "fixtures/logs/malformed-json.log",
    "fixtures/logs/missing-run-id.log",
    "fixtures/logs/mixed-valid-invalid.log",
  ],
  configs: [
    "fixtures/configs/proactive-agent-inspect.logs.json",
    "fixtures/configs/minimal-agent-inspect.logs.json",
    "fixtures/configs/pino-agent-inspect.logs.json",
    "fixtures/configs/log4js-agent-inspect.logs.json",
    "fixtures/configs/nestjs-agent-inspect.logs.json",
  ],
};

/** Log files that are intentionally not line-valid JSON. */
const MALFORMED_LOGS = new Set([
  "malformed-json.log",
  "mixed-valid-invalid.log",
]);

const FORBIDDEN = [
  { re: /gmail\.com/i, msg: "gmail.com" },
  { re: /sk_live[0-9a-zA-Z_]/, msg: "sk_live* secret pattern" },
  { re: /AKIA[0-9A-Z]{16}/, msg: "AWS access key id pattern" },
  {
    re: /Bearer\s+(?!fake-token\b)\S+/i,
    msg: "Bearer token (use Bearer fake-token only)",
  },
];

let validateEvent;
let isPersistedInspectEvent;
try {
  const mod = await import(
    pathToFileURL(path.join(root, "packages/core/dist/index.mjs")).href,
  );
  validateEvent = mod.validateEvent;
  isPersistedInspectEvent = mod.isPersistedInspectEvent;
} catch (e) {
  console.error(
    "[fixtures:check] Could not import packages/core/dist/index.mjs. Run `pnpm build` first.\n",
    e,
  );
  process.exit(1);
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

function scanForbidden(rel) {
  const text = readText(rel);
  for (const { re, msg } of FORBIDDEN) {
    if (re.test(text)) {
      throw new Error(`Forbidden content in ${rel}: ${msg}`);
    }
  }
}

function validatePersistedTraceJsonl(rel) {
  const text = readText(rel);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error(`${rel}: empty`);
  for (let i = 0; i < lines.length; i++) {
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch (e) {
      throw new Error(`${rel} line ${i + 1}: invalid JSON (${e})`);
    }
    if (obj.schemaVersion !== "0.2") {
      throw new Error(`${rel} line ${i + 1}: schemaVersion must be "0.2"`);
    }
    if (!isPersistedInspectEvent(obj)) {
      throw new Error(`${rel} line ${i + 1}: not a valid PersistedInspectEvent`);
    }
  }
}

function validateStableTraceJsonl(rel) {
  const text = readText(rel);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error(`${rel}: empty`);
  for (let i = 0; i < lines.length; i++) {
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch (e) {
      throw new Error(`${rel} line ${i + 1}: invalid JSON (${e})`);
    }
    if (obj.schemaVersion !== "1.0") {
      throw new Error(`${rel} line ${i + 1}: schemaVersion must be "1.0"`);
    }
    if (!isPersistedInspectEvent(obj)) {
      throw new Error(`${rel} line ${i + 1}: not a valid PersistedInspectEvent`);
    }
  }
}

function validateTraceJsonl(rel) {
  const text = readText(rel);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error(`${rel}: empty`);
  for (let i = 0; i < lines.length; i++) {
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch (e) {
      throw new Error(`${rel} line ${i + 1}: invalid JSON (${e})`);
    }
    if (obj.schemaVersion !== "0.1") {
      throw new Error(`${rel} line ${i + 1}: schemaVersion must be "0.1"`);
    }
    if (!validateEvent(obj)) {
      throw new Error(`${rel} line ${i + 1}: not a valid TraceEvent`);
    }
  }
}

function validateJsonLog(rel) {
  const base = path.basename(rel);
  const text = readText(rel);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (MALFORMED_LOGS.has(base)) {
    let anyParseFail = false;
    for (const line of lines) {
      try {
        JSON.parse(line);
      } catch {
        anyParseFail = true;
      }
    }
    if (!anyParseFail) {
      throw new Error(`${rel}: expected at least one non-JSON line`);
    }
    return;
  }
  if (base === "missing-run-id.log") {
    for (let i = 0; i < lines.length; i++) {
      JSON.parse(lines[i]);
    }
    return;
  }
  if (base === "proactive-log4js.log" || base === "log4js-agent-json.log") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idx = line.lastIndexOf("{");
      if (idx < 0) throw new Error(`${rel} line ${i + 1}: no JSON object`);
      JSON.parse(line.slice(idx));
    }
    return;
  }
  if (
    base === "pino-agent-json.log" ||
    base === "nestjs-agent-json.log" ||
    base === "proactive-json.log"
  ) {
    for (let i = 0; i < lines.length; i++) {
      JSON.parse(lines[i]);
    }
  }
}

function validateConfig(rel) {
  const text = readText(rel);
  const cfg = JSON.parse(text);
  if (!Array.isArray(cfg.runIdKeys) || cfg.runIdKeys.length === 0) {
    throw new Error(`${rel}: runIdKeys must be a non-empty array`);
  }
  if (typeof cfg.eventKey !== "string" || cfg.eventKey === "") {
    throw new Error(`${rel}: eventKey required`);
  }
  if (cfg.mappings !== undefined && typeof cfg.mappings !== "object") {
    throw new Error(`${rel}: mappings must be an object when present`);
  }
}

function walkFixturesFiles() {
  const out = [];
  const baseDir = path.join(root, "fixtures");
  function walk(dir, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, rel);
      } else {
        out.push(`fixtures/${rel.replace(/\\/g, "/")}`);
      }
    }
  }
  walk(baseDir);
  return out;
}

try {
  for (const rel of REQUIRED.readmes) assertFile(rel);
  for (const rel of REQUIRED.traces) assertFile(rel);
  for (const rel of REQUIRED.tracesV02) assertFile(rel);
  for (const rel of REQUIRED.tracesV10) assertFile(rel);
  for (const rel of REQUIRED.logs) assertFile(rel);
  for (const rel of REQUIRED.configs) assertFile(rel);

  for (const rel of REQUIRED.traces) {
    validateTraceJsonl(rel);
    scanForbidden(rel);
  }

  for (const rel of REQUIRED.tracesV02) {
    validatePersistedTraceJsonl(rel);
    scanForbidden(rel);
  }

  for (const rel of REQUIRED.tracesV10) {
    validateStableTraceJsonl(rel);
    scanForbidden(rel);
  }

  for (const rel of REQUIRED.logs) {
    validateJsonLog(rel);
    scanForbidden(rel);
  }

  for (const rel of REQUIRED.configs) {
    validateConfig(rel);
    scanForbidden(rel);
  }

  for (const rel of walkFixturesFiles()) {
    scanForbidden(rel);
  }

  console.log("[fixtures:check] OK");
  console.log(`  traces: ${REQUIRED.traces.length} v0.1 JSONL files validated`);
  console.log(`  traces-v0.2: ${REQUIRED.tracesV02.length} v0.2 JSONL files validated`);
  console.log(`  traces-v1.0: ${REQUIRED.tracesV10.length} v1.0 JSONL files validated`);
  console.log(`  logs: ${REQUIRED.logs.length} files`);
  console.log(`  configs: ${REQUIRED.configs.length} JSON files`);
  process.exit(0);
} catch (e) {
  console.error("[fixtures:check] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
}
