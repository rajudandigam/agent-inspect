import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_SUITE_ARTIFACTS_DIR,
  defaultSuiteConfigTemplate,
  loadSuiteConfig,
  renderSuiteReport,
  runSuite,
  validateSuiteConfig,
  type SuiteRunResult,
} from "@agent-inspect/core/advanced";

export interface SuiteCommandOptions {
  config?: string;
  json?: boolean;
  markdown?: boolean;
  output?: string;
  cwd?: string;
  dryRun?: boolean;
  yes?: boolean;
}

export interface SuiteReportCommandOptions {
  input?: string;
  format?: "markdown" | "json";
  json?: boolean;
  cwd?: string;
}

const DEFAULT_CONFIG_FILENAME = "agent-inspect.suite.json";

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function resolveCwd(options: { cwd?: string }): string {
  return path.resolve(options.cwd ?? process.cwd());
}

export async function suiteInitCommand(options: SuiteCommandOptions = {}): Promise<void> {
  const cwd = resolveCwd(options);
  const configPath = path.join(cwd, DEFAULT_CONFIG_FILENAME);
  const template = defaultSuiteConfigTemplate();

  if (options.dryRun) {
    if (options.json) {
      printJson({
        ok: true,
        dryRun: true,
        wouldWrite: [DEFAULT_CONFIG_FILENAME],
        config: template,
      });
      return;
    }
    console.log("Dry run — would create:");
    console.log(`- ${DEFAULT_CONFIG_FILENAME}`);
    return;
  }

  try {
    await writeFile(configPath, `${JSON.stringify(template, null, 2)}\n`, "utf-8");
    if (options.json) {
      printJson({ ok: true, created: [DEFAULT_CONFIG_FILENAME], configPath });
      return;
    }
    console.log("Created suite config:");
    console.log(`- ${DEFAULT_CONFIG_FILENAME}`);
    console.log("\nNext:");
    console.log("  npx agent-inspect suite validate");
    console.log("  npx agent-inspect suite run --json");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      printJson({ ok: false, error: message });
    } else {
      console.error(`[AgentInspect] suite init failed: ${message}`);
    }
    process.exitCode = 1;
  }
}

export async function suiteValidateCommand(options: SuiteCommandOptions = {}): Promise<void> {
  try {
    const { config, configPath, configDir } = await loadSuiteConfig({
      configPath: options.config,
      cwd: options.cwd,
    });
    const validation = await validateSuiteConfig(config, { configDir });
    const payload = {
      ok: validation.ok,
      configPath,
      suiteName: config.name,
      cases: config.cases.length,
      diagnostics: validation.diagnostics,
    };
    if (options.json) {
      printJson(payload);
    } else if (validation.ok) {
      console.log(`Suite "${config.name}" is valid (${config.cases.length} cases).`);
      console.log(`Config: ${configPath}`);
    } else {
      console.error(`Suite "${config.name}" has validation errors.`);
      for (const item of validation.diagnostics) {
        console.error(`- [${item.severity}] ${item.message}`);
      }
    }
    if (!validation.ok) process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      printJson({ ok: false, error: message });
    } else {
      console.error(`[AgentInspect] suite validate failed: ${message}`);
    }
    process.exitCode = 1;
  }
}

export async function suiteListCommand(options: SuiteCommandOptions = {}): Promise<void> {
  try {
    const { config, configPath } = await loadSuiteConfig({
      configPath: options.config,
      cwd: options.cwd,
    });
    if (options.json) {
      printJson({
        ok: true,
        suiteName: config.name,
        configPath,
        traces: config.traces,
        cases: config.cases,
      });
      return;
    }
    console.log(`Suite: ${config.name}`);
    console.log(`Config: ${configPath}`);
    console.log(`Traces: ${config.traces}`);
    console.log("Cases:");
    for (const suiteCase of config.cases) {
      const target = suiteCase.trace ?? suiteCase.runId ?? suiteCase.id;
      console.log(`  ${suiteCase.id} -> ${target}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      printJson({ ok: false, error: message });
    } else {
      console.error(`[AgentInspect] suite list failed: ${message}`);
    }
    process.exitCode = 1;
  }
}

async function writeSuiteArtifact(
  result: SuiteRunResult,
  configOutputDir: string | undefined,
  options: SuiteCommandOptions,
): Promise<string | undefined> {
  const cwd = resolveCwd(options);
  const outputDir = path.resolve(
    cwd,
    options.output ?? configOutputDir ?? DEFAULT_SUITE_ARTIFACTS_DIR,
  );
  await mkdir(outputDir, { recursive: true });
  const stamp = result.startedAt.replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `${result.suiteName}-${stamp}.json`);
  await writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
  return filePath;
}

export async function suiteRunCommand(options: SuiteCommandOptions = {}): Promise<void> {
  try {
    const { config } = await loadSuiteConfig({
      configPath: options.config,
      cwd: options.cwd,
    });
    const result = await runSuite({
      configPath: options.config,
      cwd: options.cwd,
    });
    const artifactPath = await writeSuiteArtifact(
      result,
      config.artifacts?.outputDir,
      options,
    );

    if (options.json) {
      printJson({ ...result, artifactPath: artifactPath ?? null });
    } else if (options.markdown) {
      console.log(renderSuiteReport(result, { format: "markdown" }));
      if (artifactPath !== undefined) {
        console.log("");
        console.log(`Artifact: ${artifactPath}`);
      }
    } else {
      console.log(`Suite: ${result.suiteName}`);
      console.log(`Status: ${result.status}`);
      console.log(
        `Cases: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.errors} errors, ${result.summary.skipped} skipped`,
      );
      for (const suiteCase of result.cases) {
        const suffix = suiteCase.message ? ` — ${suiteCase.message}` : "";
        console.log(`  ${suiteCase.id}: ${suiteCase.status}${suffix}`);
      }
      if (artifactPath !== undefined) {
        console.log(`Artifact: ${artifactPath}`);
      }
    }

    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      printJson({ ok: false, error: message });
    } else {
      console.error(`[AgentInspect] suite run failed: ${message}`);
    }
    process.exitCode = 1;
  }
}

async function loadSuiteResultFromInput(
  options: SuiteReportCommandOptions,
): Promise<SuiteRunResult> {
  const cwd = resolveCwd(options);
  if (options.input === undefined || options.input.trim() === "") {
    throw new Error("Pass --input <suite-run.json> from a prior suite run.");
  }
  const inputPath = path.resolve(cwd, options.input.trim());
  const raw = await readFile(inputPath, "utf-8");
  return JSON.parse(raw) as SuiteRunResult;
}

export async function suiteReportCommand(
  options: SuiteReportCommandOptions = {},
): Promise<void> {
  try {
    const result = await loadSuiteResultFromInput(options);
    const format = options.format ?? (options.json ? "json" : "markdown");
    const content = renderSuiteReport(result, { format });
    if (format === "json" || options.json) {
      printJson(JSON.parse(content));
    } else {
      console.log(content);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      printJson({ ok: false, error: message });
    } else {
      console.error(`[AgentInspect] suite report failed: ${message}`);
    }
    process.exitCode = 1;
  }
}
