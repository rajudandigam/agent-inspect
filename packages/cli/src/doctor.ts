import { existsSync, readFileSync } from "node:fs";
import { access, constants, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

import { version as packageVersion } from "../../../package.json";

export type DoctorStatus = "pass" | "warn" | "fail" | "skipped";

export type InitFramework =
  | "ai-sdk"
  | "openai-agents"
  | "langchain"
  | "langgraph"
  | "custom";

export interface DoctorCheckResult {
  id: string;
  status: DoctorStatus;
  message: string;
  remediation?: string;
  evidence?: string;
}

export interface DoctorCommandOptions {
  json?: boolean;
  traceDir?: string;
  checkImports?: boolean;
  framework?: InitFramework;
  cwd?: string;
}

/** Current docs base for actionable remediation links (resolves for packed consumers). */
export const DOCS_BASE = "https://github.com/rajudandigam/agent-inspect/blob/main/docs";

/** Message shown when agent-inspect cannot be resolved from the current project. */
export const AGENT_INSPECT_NOT_RESOLVABLE_MESSAGE =
  "agent-inspect does not resolve from this project. A global CLI install is not enough — the package must be a dependency here.";

/** Remediation for the not-resolvable case (common packed-consumer mistake). */
export const AGENT_INSPECT_NOT_RESOLVABLE_REMEDIATION = `Install it in this project: npm install agent-inspect (or pnpm add agent-inspect). See ${DOCS_BASE}/FIRST-TRACE-IN-5-MINUTES.md`;

const OPTIONAL_PACKAGES: Record<InitFramework, string[]> = {
  custom: [],
  "ai-sdk": ["@agent-inspect/ai-sdk"],
  "openai-agents": ["@agent-inspect/openai-agents"],
  langchain: ["@agent-inspect/langchain"],
  langgraph: ["@agent-inspect/langchain"],
};

function nodeVersionCheck(): DoctorCheckResult {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isNaN(major) || major < 20) {
    return {
      id: "node-version",
      status: "fail",
      message: `Node ${process.versions.node} is below the supported minimum (20).`,
      remediation: `Upgrade to Node 20 LTS or newer, then reinstall. See ${DOCS_BASE}/GETTING-STARTED.md`,
      evidence: process.versions.node,
    };
  }
  return {
    id: "node-version",
    status: "pass",
    message: `Node ${process.versions.node} meets the minimum (>=20).`,
    evidence: process.versions.node,
  };
}

function envCheck(name: string, optional = true): DoctorCheckResult {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    return {
      id: `env-${name.toLowerCase()}`,
      status: optional ? "skipped" : "warn",
      message: `${name} is not set.`,
      remediation: optional ? undefined : `Set ${name}=1 to enable tracing.`,
    };
  }
  return {
    id: `env-${name.toLowerCase()}`,
    status: "pass",
    message: `${name} is set.`,
    evidence: value,
  };
}

async function traceDirWritable(traceDir: string): Promise<DoctorCheckResult> {
  const resolved = path.resolve(traceDir);
  try {
    await mkdir(resolved, { recursive: true });
    await access(resolved, constants.W_OK);
    return {
      id: "trace-dir-writable",
      status: "pass",
      message: `Trace directory is writable: ${resolved}`,
      evidence: resolved,
    };
  } catch (error) {
    return {
      id: "trace-dir-writable",
      status: "fail",
      message: `Trace directory is not writable: ${resolved}`,
      remediation: `Create the directory or set AGENT_INSPECT_TRACE_DIR to a writable path. See ${DOCS_BASE}/GETTING-STARTED.md`,
      evidence: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Locate package metadata by walking from a resolved entry file to the nearest
 * package.json whose `name` matches. Does not require `./package.json` in exports.
 */
function readPackageVersionNearEntry(entryPath: string, packageName: string): string | undefined {
  let dir = path.dirname(path.resolve(entryPath));
  const { root } = path.parse(dir);
  while (true) {
    const candidate = path.join(dir, "package.json");
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, "utf8")) as {
          name?: string;
          version?: string;
        };
        if (pkg.name === packageName && typeof pkg.version === "string") {
          return pkg.version;
        }
      } catch {
        /* continue walking past unreadable manifests */
      }
    }
    if (dir === root) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/** Resolve a package entry and version without requiring `./package.json` exports. */
export function resolveInstalledPackage(
  cwd: string,
  name: string,
): { ok: boolean; version?: string; entry?: string } {
  const require = createRequire(path.join(cwd, "package.json"));
  try {
    const entry = require.resolve(name);
    let version: string | undefined;
    try {
      const pkgPath = require.resolve(`${name}/package.json`);
      const pkg = require(pkgPath) as { version?: string };
      if (typeof pkg.version === "string") version = pkg.version;
    } catch {
      version = readPackageVersionNearEntry(entry, name);
    }
    return { ok: true, version, entry };
  } catch {
    return { ok: false };
  }
}

function importSmoke(cwd: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];
  const resolved = resolveInstalledPackage(cwd, "agent-inspect");

  if (resolved.ok) {
    results.push({
      id: "import-agent-inspect",
      status: "pass",
      message: "agent-inspect resolves from the current project.",
      evidence: resolved.entry,
    });
    // createRequire.resolve is the CJS resolver; entry success means require() can load it.
    results.push({
      id: "import-agent-inspect-cjs",
      status: "pass",
      message: "CJS resolution for agent-inspect succeeded.",
      evidence: resolved.entry,
    });
  } else {
    results.push({
      id: "import-agent-inspect",
      status: "warn",
      message: AGENT_INSPECT_NOT_RESOLVABLE_MESSAGE,
      remediation: AGENT_INSPECT_NOT_RESOLVABLE_REMEDIATION,
    });
    results.push({
      id: "import-agent-inspect-cjs",
      status: "skipped",
      message: "CJS resolution check skipped (package not installed locally).",
    });
  }

  return results;
}

function optionalPackageChecks(cwd: string, framework?: InitFramework): DoctorCheckResult[] {
  const packages =
    framework !== undefined
      ? OPTIONAL_PACKAGES[framework]
      : [
          "@agent-inspect/ai-sdk",
          "@agent-inspect/openai-agents",
          "@agent-inspect/langchain",
          "@agent-inspect/redact",
          "@agent-inspect/eval",
        ];

  return packages.map((name) => {
    const resolved = resolveInstalledPackage(cwd, name);
    if (!resolved.ok) {
      return {
        id: `optional-package-${name}`,
        status: framework !== undefined ? "warn" : "skipped",
        message: `${name} is not installed.`,
        remediation: framework !== undefined ? `npm install ${name}` : undefined,
      };
    }
    return {
      id: `optional-package-${name}`,
      status: "pass",
      message: `${name} is available.`,
      evidence: resolved.version,
    };
  });
}

function versionMismatchCheck(cwd: string): DoctorCheckResult {
  const root = resolveInstalledPackage(cwd, "agent-inspect");
  if (!root.ok || root.version === undefined) {
    return {
      id: "version-alignment",
      status: "skipped",
      message: "Skipped version alignment — agent-inspect not installed locally.",
    };
  }
  if (root.version !== packageVersion) {
    return {
      id: "version-alignment",
      status: "warn",
      message: `CLI version ${packageVersion} differs from local agent-inspect@${root.version}. A packed consumer can hit this when npx uses a cached global CLI.`,
      remediation: `Align versions with npm install agent-inspect@${packageVersion}, or run via the local binary. See ${DOCS_BASE}/KNOWN-ISSUES.md`,
      evidence: `cli=${packageVersion};local=${root.version}`,
    };
  }
  return {
    id: "version-alignment",
    status: "pass",
    message: `CLI and local agent-inspect are aligned at ${packageVersion}.`,
  };
}

export async function runDoctorChecks(
  options: DoctorCommandOptions = {},
): Promise<DoctorCheckResult[]> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const traceDir =
    options.traceDir?.trim() ||
    process.env.AGENT_INSPECT_TRACE_DIR?.trim() ||
    ".agent-inspect";

  const checks: DoctorCheckResult[] = [
    nodeVersionCheck(),
    {
      id: "cli-version",
      status: "pass",
      message: `agent-inspect CLI ${packageVersion}`,
      evidence: packageVersion,
    },
    await traceDirWritable(traceDir),
    envCheck("AGENT_INSPECT"),
    envCheck("AGENT_INSPECT_TRACE_DIR"),
    versionMismatchCheck(cwd),
  ];

  if (options.checkImports !== false) {
    checks.push(...importSmoke(cwd));
  }
  checks.push(...optionalPackageChecks(cwd, options.framework));

  return checks.sort((a, b) => a.id.localeCompare(b.id));
}

export async function doctorCommand(options: DoctorCommandOptions = {}): Promise<void> {
  const checks = await runDoctorChecks(options);
  const failed = checks.filter((check) => check.status === "fail").length;
  const warned = checks.filter((check) => check.status === "warn").length;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ok: failed === 0,
          version: packageVersion,
          summary: { pass: checks.filter((c) => c.status === "pass").length, warn: warned, fail: failed },
          checks,
        },
        null,
        2,
      ),
    );
    if (failed > 0) process.exitCode = 1;
    return;
  }

  console.log("AgentInspect doctor");
  for (const check of checks) {
    const tag = check.status.toUpperCase();
    console.log(`[${tag}] ${check.id}: ${check.message}`);
    if (check.remediation) console.log(`  → ${check.remediation}`);
  }
  console.log(`\nSummary: ${failed} failed, ${warned} warnings`);
  if (failed > 0) process.exitCode = 1;
}
