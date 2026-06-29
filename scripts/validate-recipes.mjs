/**
 * Validate v0.9 recipe examples: layout, non-empty expected-output, no forbidden secrets/imports.
 * Run from repo root; does not require `pnpm build`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipesRoot = path.join(root, "examples", "recipes");

const RECIPES = [
  "rag-pipeline",
  "tool-failure-retry",
  "multi-agent-handoff",
  "proactive-agent-logs",
  "pino-json-logs",
  "winston-json-logs",
  "log4js-json-layout",
  "nestjs-json-logging",
  "retry-fallback",
  "parallel-tools",
  "github-actions-artifact",
  "deterministic-ci-checks",
  "test-reporter-artifacts",
  "what-report-inspect",
  "runtime-and-ingestion",
  "ai-sdk-local-telemetry",
  "ai-sdk-next-route",
  "openai-agents-local-tracing",
  "langgraph-callback-local",
  "harness-basic",
  "harness-adapter-local",
  "eval-local-checks",
  "redact-share-safe-file",
  "eval-ci-artifacts",
  "mcp-client-tracing",
  "guardrails-basic",
  "circuit-breaker-basic",
  "read-only-mcp-server",
];

const LOG_RECIPE_FILES = {
  "proactive-agent-logs": [
    "agent-inspect.logs.json",
    "sample-json.log",
    "sample-log4js.log",
  ],
  "pino-json-logs": ["agent-inspect.logs.json", "sample-pino.log"],
  "winston-json-logs": ["agent-inspect.logs.json", "sample-winston.log"],
  "log4js-json-layout": ["agent-inspect.logs.json", "sample-log4js.log"],
  "nestjs-json-logging": ["agent-inspect.logs.json", "sample-nestjs.log"],
};

const FORBIDDEN = [
  { re: /gmail\.com/i, msg: "gmail.com" },
  { re: /sk_live[0-9a-zA-Z_]/, msg: "sk_live* secret pattern" },
  { re: /AKIA[0-9A-Z]{16}/, msg: "AWS access key id pattern" },
];

const FORBIDDEN_IMPORT_RE = /^\s*import\s+.*\s+from\s+["']([^"']+)["']/gm;

const BANNED_IMPORT_PREFIXES = [
  "openai",
  "ai",
  "@ai-sdk",
  "@anthropic-ai",
  "@nestjs",
  "pinecone",
  "@pinecone",
  "chromadb",
  "langchain",
  "@langchain",
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkBannedImports(rel, text) {
  if (!/\.tsx?$/i.test(rel)) return;
  const allowAiSdkFixture =
    rel.startsWith(path.join("examples", "recipes", "ai-sdk-local-telemetry")) ||
    rel.startsWith("examples/recipes/ai-sdk-local-telemetry/") ||
    rel.startsWith(path.join("examples", "recipes", "ai-sdk-next-route")) ||
    rel.startsWith("examples/recipes/ai-sdk-next-route/");
  const allowOpenAiAgentsFixture =
    rel.startsWith(path.join("examples", "recipes", "openai-agents-local-tracing")) ||
    rel.startsWith("examples/recipes/openai-agents-local-tracing/");
  FORBIDDEN_IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = FORBIDDEN_IMPORT_RE.exec(text)) !== null) {
    const spec = m[1] ?? "";
    if (allowAiSdkFixture && (spec === "ai" || spec === "ai/test")) {
      continue;
    }
    if (allowOpenAiAgentsFixture && spec === "@openai/agents") {
      continue;
    }
    for (const p of BANNED_IMPORT_PREFIXES) {
      if (spec === p || spec.startsWith(`${p}/`)) {
        throw new Error(`Forbidden import in ${rel}: ${spec}`);
      }
    }
  }
}

function scanFile(rel) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  for (const { re, msg } of FORBIDDEN) {
    if (re.test(text)) {
      throw new Error(`Forbidden content in ${rel}: ${msg}`);
    }
  }
  checkBannedImports(rel, text);
}

function walkTsAndJson(dirRel, acc) {
  const abs = path.join(root, dirRel);
  if (!fs.existsSync(abs)) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dirRel, ent.name);
    if (ent.isDirectory()) walkTsAndJson(rel, acc);
    else if (/\.(ts|tsx|json|md|txt|log)$/i.test(ent.name)) acc.push(rel);
  }
}

function main() {
  assert(fs.existsSync(recipesRoot), `Missing ${path.relative(root, recipesRoot)}`);

  const readme = path.join(recipesRoot, "README.md");
  assert(fs.existsSync(readme), "Missing examples/recipes/README.md");

  for (const name of RECIPES) {
    const dirRel = path.join("examples", "recipes", name);
    const dir = path.join(root, dirRel);
    assert(fs.existsSync(dir), `Missing recipe dir ${dirRel}`);
    assert(fs.existsSync(path.join(dir, "README.md")), `Missing ${dirRel}/README.md`);

    const expectedPath = path.join(dir, "expected-output.txt");
    assert(fs.existsSync(expectedPath), `Missing ${dirRel}/expected-output.txt`);
    const expected = fs.readFileSync(expectedPath, "utf8").trim();
    assert(expected.length > 0, `${dirRel}/expected-output.txt must be non-empty`);

    const pkgPath = path.join(dir, "package.json");
    assert(fs.existsSync(pkgPath), `Missing ${dirRel}/package.json`);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    assert(pkg.private === true, `${dirRel}/package.json must set "private": true`);

    const indexTs = path.join(dir, "src", "index.ts");
    assert(fs.existsSync(indexTs), `Missing ${dirRel}/src/index.ts`);

    const filesToScan = [];
    walkTsAndJson(dirRel, filesToScan);
    for (const rel of filesToScan) {
      scanFile(rel);
    }

    const extraFiles = LOG_RECIPE_FILES[name];
    if (extraFiles) {
      for (const f of extraFiles) {
        assert(
          fs.existsSync(path.join(dir, f)),
          `Missing ${dirRel}/${f}`,
        );
      }
    }
  }

  console.log("[recipes:check] OK —", RECIPES.length, "recipes validated.");
}

try {
  main();
} catch (e) {
  console.error("[recipes:check]", e.message || e);
  process.exit(1);
}
