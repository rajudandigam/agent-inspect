import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_SUITE_CONFIG_NAMES,
  type LoadSuiteConfigOptions,
  type SuiteConfig,
  type SuiteDiagnostic,
} from "./types.js";
import { normalizeSuiteConfig } from "./validate.js";

const CONFIG_EXTENSIONS = new Set([".json", ".js", ".mjs", ".cjs"]);
const TS_CONFIG_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);

function diagnostic(
  code: SuiteDiagnostic["code"],
  message: string,
): SuiteDiagnostic {
  return { code, message, severity: "error" };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveSuiteConfigPath(
  options: LoadSuiteConfigOptions = {},
): Promise<string> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (options.configPath !== undefined && options.configPath.trim() !== "") {
    return path.resolve(cwd, options.configPath.trim());
  }

  for (const name of DEFAULT_SUITE_CONFIG_NAMES) {
    const candidate = path.join(cwd, name);
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error(
    `No suite config found. Create one with \`agent-inspect suite init\` or pass --config.`,
  );
}

export async function loadSuiteConfig(
  options: LoadSuiteConfigOptions = {},
): Promise<{ config: SuiteConfig; configPath: string; configDir: string }> {
  let configPath: string;
  try {
    configPath = await resolveSuiteConfigPath(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(message), {
      diagnostics: [diagnostic("AI_SUITE_CONFIG_LOAD_FAILED", message)],
    });
  }

  const extension = path.extname(configPath);
  if (TS_CONFIG_EXTENSIONS.has(extension)) {
    const message =
      "TypeScript suite configs require an explicit precompiled JavaScript config or future --config-loader support.";
    throw Object.assign(new Error(message), {
      diagnostics: [diagnostic("AI_SUITE_CONFIG_LOAD_FAILED", message)],
    });
  }
  if (!CONFIG_EXTENSIONS.has(extension)) {
    const message = "Unsupported suite config extension. Use .json, .js, .mjs, or .cjs.";
    throw Object.assign(new Error(message), {
      diagnostics: [diagnostic("AI_SUITE_CONFIG_LOAD_FAILED", message)],
    });
  }

  try {
    let raw: unknown;
    if (extension === ".json") {
      raw = JSON.parse(await readFile(configPath, "utf-8"));
    } else {
      const mod = await import(pathToFileURL(configPath).href);
      raw = "default" in mod ? mod.default : mod;
    }
    const config = normalizeSuiteConfig(raw);
    return {
      config,
      configPath,
      configDir: path.dirname(configPath),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(message), {
      diagnostics: [diagnostic("AI_SUITE_CONFIG_LOAD_FAILED", message)],
    });
  }
}

export function defaultSuiteConfigTemplate(): SuiteConfig {
  return {
    name: "my-agent-suite",
    traces: "./.agent-inspect",
    cases: [
      {
        id: "example-case",
        runId: "example-run",
        requireTools: ["searchDocs"],
        maxDurationMs: 30_000,
        expectedObservations: ["answerReady"],
      },
    ],
    checks: {
      select: ["run.status"],
    },
    redactionProfile: "local",
    artifacts: {
      outputDir: ".agent-inspect/suite-runs",
    },
  };
}
