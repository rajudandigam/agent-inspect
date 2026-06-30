import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { version as packageVersion } from "../../../package.json";

export type InitFramework = "ai-sdk" | "openai-agents" | "langchain" | "custom";

export interface InitCommandOptions {
  framework?: InitFramework;
  ci?: "github";
  dryRun?: boolean;
  yes?: boolean;
  json?: boolean;
  cwd?: string;
}

export interface InitPlannedFile {
  path: string;
  action: "create" | "skip";
  reason?: string;
}

export interface InitPlan {
  framework: InitFramework;
  ci?: "github";
  files: InitPlannedFile[];
}

const CONFIG_FILE = "agent-inspect.config.ts";
const TRACE_DIR = ".agent-inspect";
const GITKEEP = ".agent-inspect/.gitkeep";

function normalizeFramework(value: string | undefined): InitFramework {
  const raw = (value ?? "custom").trim();
  if (raw === "ai-sdk" || raw === "openai-agents" || raw === "langchain" || raw === "custom") {
    return raw;
  }
  throw new Error(
    'Unsupported --framework value. Use ai-sdk, openai-agents, langchain, or custom.',
  );
}

function configTemplate(framework: InitFramework): string {
  const base = `/**
 * AgentInspect local config (metadata-only capture by default).
 * See https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md
 */
export const agentInspectConfig = {
  traceDir: ".agent-inspect",
  enabled: process.env.AGENT_INSPECT !== "0",
  redactionProfile: "local" as const,
};
`;
  if (framework === "custom") return base;
  return `${base}
export const framework = "${framework}" as const;
`;
}

function demoTemplate(framework: InitFramework): string {
  switch (framework) {
    case "ai-sdk":
      return `/**
 * AI SDK starter — metadata-only telemetry (no real model calls in this demo).
 * Install: npm install agent-inspect @agent-inspect/ai-sdk ai
 */
import { inspectRun, step } from "agent-inspect";

async function main() {
  await inspectRun("ai-sdk-demo", async () => {
    await step.tool("mock-generate", async () => ({ text: "ok" }));
  }, { traceDir: ".agent-inspect", silent: true });
  console.log("Trace written to .agent-inspect/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
    case "openai-agents":
      return `/**
 * OpenAI Agents starter — use @agent-inspect/openai-agents for local-only processors.
 * This demo uses manual steps (no API keys).
 */
import { inspectRun, step } from "agent-inspect";

async function main() {
  await inspectRun("openai-agents-demo", async () => {
    await step.tool("mock-agent-run", async () => "ok");
  }, { traceDir: ".agent-inspect", silent: true });
  console.log("Trace written to .agent-inspect/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
    case "langchain":
      return `/**
 * LangChain starter — wire @agent-inspect/langchain callbacks in your app.
 * This demo uses manual steps (no API keys).
 */
import { inspectRun, step } from "agent-inspect";

async function main() {
  await inspectRun("langchain-demo", async () => {
    await step.tool("mock-chain", async () => "ok");
  }, { traceDir: ".agent-inspect", silent: true });
  console.log("Trace written to .agent-inspect/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
    default:
      return `import { observe } from "agent-inspect";

class DemoAgent {
  async run(input: { question: string }) {
    return { answer: \`Echo: \${input.question}\` };
  }
}

const agent = observe(new DemoAgent(), {
  traceDir: ".agent-inspect",
  silent: true,
});

await agent.run({ question: "hello" });
console.log("Trace written to .agent-inspect/");
`;
  }
}

function githubWorkflowTemplate(): string {
  return `name: AgentInspect artifacts

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  trace-artifacts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
      - run: npm test
      - name: Upload AgentInspect traces
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: agent-inspect-traces
          path: .agent-inspect/**/*.jsonl
          if-no-files-found: ignore
`;
}

export async function planInit(options: InitCommandOptions = {}): Promise<InitPlan> {
  const framework = normalizeFramework(options.framework);
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const demoPath =
    framework === "custom"
      ? path.join("examples", "agent-inspect-demo.mjs")
      : path.join("examples", `agent-inspect-${framework}-demo.mjs`);

  const candidates: Array<{ rel: string; content: string }> = [
    { rel: CONFIG_FILE, content: configTemplate(framework) },
    { rel: GITKEEP, content: "" },
    { rel: demoPath, content: demoTemplate(framework) },
  ];

  if (options.ci === "github") {
    candidates.push({
      rel: ".github/workflows/agent-inspect-artifacts.yml",
      content: githubWorkflowTemplate(),
    });
  }

  const files: InitPlannedFile[] = [];
  for (const candidate of candidates) {
    const abs = path.join(cwd, candidate.rel);
    try {
      await access(abs);
      files.push({
        path: candidate.rel,
        action: "skip",
        reason: "file already exists",
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      files.push({ path: candidate.rel, action: "create" });
    }
  }

  return { framework, ...(options.ci ? { ci: options.ci } : {}), files };
}

async function writePlannedFiles(
  plan: InitPlan,
  cwd: string,
  options: InitCommandOptions,
): Promise<string[]> {
  const written: string[] = [];
  for (const entry of plan.files) {
    if (entry.action === "skip") {
      continue;
    }

    const abs = path.join(cwd, entry.path);
    if (options.dryRun) {
      written.push(entry.path);
      continue;
    }

    await mkdir(path.dirname(abs), { recursive: true });
    const content =
      entry.path === CONFIG_FILE
        ? configTemplate(plan.framework)
        : entry.path === GITKEEP
          ? ""
          : entry.path.endsWith(".yml")
            ? githubWorkflowTemplate()
            : demoTemplate(plan.framework);
    await writeFile(abs, content, "utf-8");
    written.push(entry.path);
  }
  return written;
}

export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  const cwd = path.resolve(options.cwd ?? process.cwd());

  try {
    const plan = await planInit({ ...options, cwd });
    const toWrite = plan.files.filter((file) => file.action === "create").map((f) => f.path);
    const skipped = plan.files.filter((file) => file.action === "skip");

    if (options.json) {
      const payload = {
        ok: true,
        version: packageVersion,
        framework: plan.framework,
        ci: plan.ci ?? null,
        dryRun: options.dryRun === true,
        planned: plan.files,
        wouldWrite: options.dryRun ? toWrite : undefined,
      };
      console.log(JSON.stringify(payload, null, 2));
      if (options.dryRun) return;
    }

    const written = await writePlannedFiles(plan, cwd, options);

    if (!options.json) {
      console.log("AgentInspect init");
      console.log(`Framework: ${plan.framework}`);
      console.log(`Trace directory: ${TRACE_DIR}/`);
      if (options.dryRun) {
        console.log("Dry run — would create:");
        for (const file of toWrite) console.log(`- ${file}`);
        for (const file of skipped) {
          console.log(`- ${file.path} (skip: ${file.reason ?? "exists"})`);
        }
        return;
      }
      console.log("Created:");
      for (const file of written) console.log(`- ${file}`);
      for (const file of skipped) {
        console.log(`- ${file.path} (skipped: ${file.reason ?? "exists"})`);
      }
      console.log("\nNext: run your demo, then `npx agent-inspect list --dir .agent-inspect`");
      console.log("No dependencies were installed. Add packages manually when ready.");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
    } else {
      console.error(`[AgentInspect] init failed: ${msg}`);
    }
    process.exitCode = 1;
  }
}

export async function readInitConfig(cwd: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(cwd, CONFIG_FILE), "utf8");
  } catch {
    return undefined;
  }
}
