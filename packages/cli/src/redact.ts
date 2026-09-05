import { readFile, stat, writeFile } from "node:fs/promises";

import {
  getTraceFilePath,
  resolveTraceDir,
} from "@agent-inspect/core/advanced";
import type { RedactionProfile } from "@agent-inspect/redact";

import {
  resolveOutputOption,
  resolveRedactionProfileOption,
} from "./cli-option-aliases.js";
import { redactTraceContent } from "./redact-content.js";
import {
  loadRedactionPolicy,
  summarizeRedactionPolicy,
  type CompiledRedactionPolicy,
} from "./redaction-policy.js";
import {
  assessResidualSafety,
  residualExitCode,
  residualWarningLine,
} from "./residual-safety.js";
import { readStdin } from "./trace-input.js";

export interface RedactCommandOptions {
  dir?: string;
  profile?: string;
  redactionProfile?: string;
  output?: string;
  out?: string;
  json?: boolean;
  /** Local bounded redaction policy file (see docs/SAFETY-POLICY.md). */
  policy?: string;
  /** Opt-in non-zero exit when the redacted copy still has residual findings. */
  failOnResidual?: boolean;
}

function parseRedactionProfile(value: string | undefined): RedactionProfile {
  if (value === undefined || value === "local" || value === "share" || value === "strict") {
    return value ?? "share";
  }
  throw new Error(`Unsupported --profile "${value}". Use local, share, or strict.`);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stable(record[key])]),
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

async function contentFromTarget(
  target: string,
  options: RedactCommandOptions,
  stdin: NodeJS.ReadableStream,
): Promise<{ content: string; source: string }> {
  if (target === "-") {
    return { content: await readStdin(stdin), source: "stdin" };
  }

  try {
    const stats = await stat(target);
    if (stats.isDirectory()) {
      throw new Error("redact requires a trace file, JSON file, stdin, or run id.");
    }
    return { content: await readFile(target, "utf-8"), source: target };
  } catch (error) {
    if (!isMissingFileError(error)) throw error;
  }

  const runPath = getTraceFilePath(target, resolveTraceDir({ dir: options.dir }));
  const stats = await stat(runPath);
  if (stats.isDirectory()) {
    throw new Error("redact requires a trace file, JSON file, stdin, or run id.");
  }
  return { content: await readFile(runPath, "utf-8"), source: runPath };
}

export async function redactCommand(
  target: string,
  options: RedactCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  const profile = parseRedactionProfile(resolveRedactionProfileOption(options));
  const policy: CompiledRedactionPolicy | undefined =
    options.policy === undefined ? undefined : await loadRedactionPolicy(options.policy);
  const source = await contentFromTarget(target, options, stdin);
  // Always a derived copy; the source file is never mutated.
  const redacted = redactTraceContent(source.content, profile, policy);
  const outputPath = resolveOutputOption(options);

  if (outputPath !== undefined) {
    await writeFile(outputPath, redacted.content, "utf-8");
  }

  const residual = await assessResidualSafety(redacted.content, {
    profile,
    ...(policy !== undefined ? { policy } : {}),
  });

  if (options.json) {
    console.log(
      JSON.stringify(
        stable({
          ok: true,
          profile,
          source: source.source,
          output: outputPath,
          findings: redacted.findings,
          residualAssessment: residual,
          policy: policy === undefined ? undefined : summarizeRedactionPolicy(policy),
          content: outputPath === undefined ? redacted.content : undefined,
        }),
        null,
        2,
      ),
    );
  } else {
    if (outputPath === undefined) {
      process.stdout.write(redacted.content);
    }
    const warning = residualWarningLine(residual);
    if (warning !== undefined) console.error(`[AgentInspect] ${warning}`);
  }

  if (options.failOnResidual === true) {
    const code = residualExitCode(residual);
    if (code !== 0) process.exitCode = code;
  }
}
