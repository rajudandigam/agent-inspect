/**
 * Packed-consumer probe: install a tarball built from the current main SHA and
 * confirm `--required-tool update_trip_draft` matches via gen_ai.tool.name on an
 * OTLP-style TOOL span whose display name is `execute_tool update_trip_draft`.
 *
 * Records SHA + tarball digest separately from registry npm 6.31.36.
 * Does not invent a version or write a Trip lockfile file: dependency.
 */
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");

function gitSha(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function sha256File(filePath: string): string {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function parsePackedFilename(packOut: string): string | null {
  try {
    const parsed = JSON.parse(packOut) as Array<{ filename?: string }> | {
      filename?: string;
    };
    if (Array.isArray(parsed)) return parsed[0]?.filename ?? null;
    return parsed.filename ?? null;
  } catch {
    const match = packOut.match(/agent-inspect-[^\s]+\.tgz/);
    return match?.[0] ?? null;
  }
}

function writeOtlpStyleTrace(filePath: string): void {
  const ts = "2026-11-17T00:00:01.000Z";
  const run = {
    schemaVersion: "1.0",
    eventId: "run_otlp_tool",
    runId: "run_otlp_tool",
    kind: "RUN",
    name: "otlp-genai-tool-probe",
    status: "ok",
    timestamp: ts,
    confidence: "explicit",
    source: { type: "manual" },
  };
  const tool = {
    schemaVersion: "1.0",
    eventId: "evt_otlp_tool",
    runId: "run_otlp_tool",
    parentId: "run_otlp_tool",
    kind: "TOOL",
    name: "execute_tool update_trip_draft",
    status: "ok",
    timestamp: ts,
    durationMs: 0,
    confidence: "explicit",
    source: { type: "manual" },
    attributes: {
      "gen_ai.operation.name": "execute_tool",
      "gen_ai.tool.name": "update_trip_draft",
    },
  };
  fs.writeFileSync(filePath, `${JSON.stringify(run)}\n${JSON.stringify(tool)}\n`);
}

function main() {
  const sha = gitSha();
  const pack = spawnSync(
    "npm",
    ["pack", "--json", "--ignore-scripts"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, npm_config_json: "true" },
    },
  );
  if (pack.status !== 0) {
    console.error(pack.stderr || pack.stdout);
    process.exit(1);
  }
  const tgzName = parsePackedFilename((pack.stdout || "").trim());
  if (!tgzName) {
    console.error("could not parse npm pack filename");
    process.exit(1);
  }
  const tgzPath = path.join(repoRoot, tgzName);
  if (!fs.existsSync(tgzPath)) {
    console.error(`tarball missing: ${tgzPath}`);
    process.exit(1);
  }
  const digest = sha256File(tgzPath);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-genai-tool-probe-"));
  try {
    fs.writeFileSync(
      path.join(tmp, "package.json"),
      JSON.stringify(
        { name: "genai-tool-name-probe", private: true, type: "module" },
        null,
        2,
      ),
    );
    execFileSync("npm", ["install", tgzPath], {
      cwd: tmp,
      stdio: "pipe",
      encoding: "utf8",
    });

    const traceFile = path.join(tmp, "otlp-genai-tool.jsonl");
    writeOtlpStyleTrace(traceFile);

    const cli = path.join(tmp, "node_modules", "agent-inspect", "packages", "cli", "dist", "index.cjs");
    const altCli = path.join(tmp, "node_modules", ".bin", "agent-inspect");
    const cliPath = fs.existsSync(cli)
      ? cli
      : fs.existsSync(altCli)
        ? altCli
        : path.join(tmp, "node_modules", "agent-inspect", "dist", "cli.cjs");

    // Prefer installed bin when present.
    const binHelp = spawnSync(
      path.join(tmp, "node_modules", ".bin", "agent-inspect"),
      ["--help"],
      { encoding: "utf8" },
    );
    const useBin = binHelp.status === 0;

    const check = spawnSync(
      useBin ? path.join(tmp, "node_modules", ".bin", "agent-inspect") : process.execPath,
      useBin
        ? ["check", traceFile, "--required-tool", "update_trip_draft", "--json"]
        : [cliPath, "check", traceFile, "--required-tool", "update_trip_draft", "--json"],
      { cwd: tmp, encoding: "utf8" },
    );

    let parsed: { ok?: boolean; findings?: unknown[] } = {};
    try {
      parsed = JSON.parse(check.stdout || "{}") as typeof parsed;
    } catch {
      /* ignore */
    }

    const ok = check.status === 0 && parsed.ok === true;
    const report = {
      ok,
      source: "packed-main",
      gitSha: sha,
      tarball: path.basename(tgzPath),
      tarballSha256: digest,
      registryNote:
        "This probe uses a tarball from the current git SHA, not npm registry 6.31.36.",
      checkExit: check.status,
      checkStdout: (check.stdout || "").slice(0, 1500),
      cliPath: useBin ? "node_modules/.bin/agent-inspect" : cliPath,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(ok ? 0 : 1);
  } finally {
    try {
      fs.unlinkSync(tgzPath);
    } catch {
      /* leave for inspection */
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
