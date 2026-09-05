import { readFile, stat, writeFile } from "node:fs/promises";

import {
  getTraceFilePath,
  resolveTraceDir,
} from "@agent-inspect/core/advanced";
import {
  createRedactor,
  type RedactionFinding,
  type RedactionProfile,
} from "@agent-inspect/redact";

import {
  resolveOutputOption,
  resolveRedactionProfileOption,
} from "./cli-option-aliases.js";
import type { CompiledRedactionPolicy } from "./redaction-policy.js";
import { loadRedactionPolicy } from "./redaction-policy.js";
import {
  assessResidualFromContent,
  type ResidualSafetyAssessment,
} from "./safety.js";
import { readStdin } from "./trace-input.js";

export interface RedactCommandOptions {
  dir?: string;
  profile?: string;
  redactionProfile?: string;
  output?: string;
  out?: string;
  json?: boolean;
  /** Local JSON path for bounded custom redaction policy (#329). */
  policy?: string;
  /** Opt-in: non-zero exit when residual assessment is UNSAFE or UNKNOWN (#328). */
  failOnResidual?: boolean;
}

interface RedactedDocument {
  content: string;
  findings: RedactionFinding[];
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

function applyRedact(
  value: unknown,
  profile: RedactionProfile,
  policy: CompiledRedactionPolicy | undefined,
): { value: unknown; findings: RedactionFinding[] } {
  const result = createRedactor({
    profile,
    ...(policy?.extraKeys.length ? { extraKeys: [...policy.extraKeys] } : {}),
    ...(policy?.detectors.length ? { detectors: [...policy.detectors] } : {}),
  }).redact(value);
  return { value: result.value, findings: result.findings };
}

function redactJsonText(
  content: string,
  profile: RedactionProfile,
  policy: CompiledRedactionPolicy | undefined,
): RedactedDocument {
  const parsed = JSON.parse(content) as unknown;
  const result = applyRedact(parsed, profile, policy);
  return {
    content: `${JSON.stringify(result.value, null, 2)}\n`,
    findings: result.findings,
  };
}

function redactJsonlText(
  content: string,
  profile: RedactionProfile,
  policy: CompiledRedactionPolicy | undefined,
): RedactedDocument {
  const lines = content.split(/\r?\n/);
  const out: string[] = [];
  const findings: RedactionFinding[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.trim() === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Input is not valid JSON or JSONL at line ${index + 1}.`);
    }

    const result = applyRedact(parsed, profile, policy);
    out.push(JSON.stringify(result.value));
    findings.push(
      ...result.findings.map((finding) => ({
        ...finding,
        path: `line:${index + 1}:${finding.path}`,
      })),
    );
  }

  return {
    content: out.length === 0 ? "" : `${out.join("\n")}\n`,
    findings,
  };
}

function redactDocument(
  content: string,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): RedactedDocument {
  const trimmed = content.trim();
  // Single-line AgentInspect events parse as JSON but must stay JSONL for re-read.
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        ("schemaVersion" in parsed || "eventId" in parsed || "runId" in parsed)
      ) {
        return redactJsonlText(content, profile, policy);
      }
    } catch {
      // fall through
    }
  }
  try {
    return redactJsonText(content, profile, policy);
  } catch {
    return redactJsonlText(content, profile, policy);
  }
}

/** Redacts JSON or JSONL trace text with the given profile (used by bundle and redact commands). */
export function redactTraceContent(
  content: string,
  profile: RedactionProfile,
  policy?: CompiledRedactionPolicy,
): RedactedDocument {
  return redactDocument(content, profile, policy);
}

function looksLikeAgentInspectTrace(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim() !== "") ?? trimmed;
    const parsed = JSON.parse(firstLine) as unknown;
    return (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      ("schemaVersion" in parsed || "eventId" in parsed || "runId" in parsed)
    );
  } catch {
    return false;
  }
}

function printResidualWarning(
  assessment: ResidualSafetyAssessment,
  sourceLooksLikeTrace: boolean,
): void {
  if (assessment.status === "SAFE") return;
  // Arbitrary JSON that is not a supported trace yields UNKNOWN; keep human stdout quiet.
  if (assessment.status === "UNKNOWN" && !sourceLooksLikeTrace) return;
  const codes =
    assessment.codes.length > 0 ? ` codes=${assessment.codes.join(",")}` : "";
  console.error(
    `Residual safety: ${assessment.status} (findings=${assessment.findings}, warnings=${assessment.warnings}, errors=${assessment.errors})${codes}. Redact does not certify safe sharing; run verify-safe before publishing.`,
  );
}

function residualExitCode(assessment: ResidualSafetyAssessment): number {
  if (assessment.status === "UNSAFE") return 1;
  if (assessment.status === "UNKNOWN") return 2;
  return 0;
}

export async function redactCommand(
  target: string,
  options: RedactCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  const profile = parseRedactionProfile(resolveRedactionProfileOption(options));
  const policy =
    options.policy !== undefined ? await loadRedactionPolicy(options.policy) : undefined;
  const source = await contentFromTarget(target, options, stdin);
  const redacted = redactDocument(source.content, profile, policy);
  const outputPath = resolveOutputOption(options);
  const residualAssessment = await assessResidualFromContent(redacted.content, {
    compiledPolicy: policy,
  });

  if (outputPath !== undefined) {
    await writeFile(outputPath, redacted.content, "utf-8");
  }

  if (options.failOnResidual === true) {
    process.exitCode = residualExitCode(residualAssessment);
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        stable({
          ok: true,
          profile,
          source: source.source,
          output: outputPath,
          findings: redacted.findings,
          residualAssessment,
          ...(policy !== undefined
            ? {
                policy: {
                  path: policy.path,
                  extraKeys: policy.extraKeys.length,
                  patterns: policy.detectors.length,
                  diagnostics: policy.diagnostics,
                },
              }
            : {}),
          content: outputPath === undefined ? redacted.content : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  printResidualWarning(residualAssessment, looksLikeAgentInspectTrace(redacted.content));

  if (outputPath === undefined) {
    process.stdout.write(redacted.content);
  }
}
