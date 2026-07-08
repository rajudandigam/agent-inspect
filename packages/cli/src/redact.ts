import { readFile, stat, writeFile } from "node:fs/promises";

import {
  getTraceFilePath,
  resolveTraceDir,
} from "@agent-inspect/core/advanced";
import {
  redact,
  type RedactionFinding,
  type RedactionProfile,
} from "@agent-inspect/redact";

import { readStdin } from "./trace-input.js";

export interface RedactCommandOptions {
  dir?: string;
  profile?: string;
  output?: string;
  json?: boolean;
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

function redactJsonText(content: string, profile: RedactionProfile): RedactedDocument {
  const parsed = JSON.parse(content) as unknown;
  const result = redact(parsed, { profile });
  return {
    content: `${JSON.stringify(result.value, null, 2)}\n`,
    findings: result.findings,
  };
}

function redactJsonlText(content: string, profile: RedactionProfile): RedactedDocument {
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

    const result = redact(parsed, { profile });
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

function redactDocument(content: string, profile: RedactionProfile): RedactedDocument {
  try {
    return redactJsonText(content, profile);
  } catch {
    return redactJsonlText(content, profile);
  }
}

/** Redacts JSON or JSONL trace text with the given profile (used by bundle and redact commands). */
export function redactTraceContent(
  content: string,
  profile: RedactionProfile,
): RedactedDocument {
  return redactDocument(content, profile);
}

export async function redactCommand(
  target: string,
  options: RedactCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  const profile = parseRedactionProfile(options.profile);
  const source = await contentFromTarget(target, options, stdin);
  const redacted = redactDocument(source.content, profile);

  if (options.output !== undefined) {
    await writeFile(options.output, redacted.content, "utf-8");
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        stable({
          ok: true,
          profile,
          source: source.source,
          output: options.output,
          findings: redacted.findings,
          content: options.output === undefined ? redacted.content : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (options.output === undefined) {
    process.stdout.write(redacted.content);
  }
}
