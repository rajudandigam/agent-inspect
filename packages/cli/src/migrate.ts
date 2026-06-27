import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateEvent } from "@agent-inspect/core/advanced";
import {
  isPersistedInspectEvent,
  traceEventToPersistedInspectEvent,
  type PersistedInspectEvent,
} from "@agent-inspect/core/persisted";

export interface MigrateCommandOptions {
  to?: string;
  dryRun?: boolean;
  output?: string;
  force?: boolean;
}

interface MigrationWarning {
  line: number;
  message: string;
}

interface MigrationResult {
  input: string;
  output?: string;
  targetSchemaVersion: "1.0";
  sourceFormats: string[];
  validRows: number;
  outputRows: number;
  skippedRows: number;
  warnings: MigrationWarning[];
  content: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTarget(value: string | undefined): "1.0" {
  const target = (value ?? "").trim();
  if (target === "1.0") return "1.0";
  throw new Error('Unsupported migration target. Use "--to 1.0".');
}

function formatOf(value: unknown): "0.1" | "0.2" | "1.0" | "unknown" {
  if (!isRecord(value)) return "unknown";
  if (value.schemaVersion === "0.1") return "0.1";
  if (value.schemaVersion === "0.2") return "0.2";
  if (value.schemaVersion === "1.0") return "1.0";
  return "unknown";
}

function toSchema10(event: PersistedInspectEvent): PersistedInspectEvent {
  return { ...event, schemaVersion: "1.0" };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function isWithinDirectory(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function resolveOutputPath(
  inputPath: string,
  output: string | undefined,
  force: boolean,
): Promise<string | undefined> {
  if (output === undefined || output.trim() === "") return undefined;

  const inputAbs = path.resolve(inputPath);
  const outputAbs = path.resolve(output.trim());
  const inputDir = path.dirname(inputAbs);

  if (!isWithinDirectory(outputAbs, inputDir)) {
    throw new Error("Refusing to write migrated output outside the input directory.");
  }
  if (outputAbs === inputAbs) {
    throw new Error("Refusing to overwrite the input trace. Choose a different --output path.");
  }

  try {
    const outputStats = await stat(outputAbs);
    if (outputStats.isDirectory()) {
      throw new Error("Migration output must be a file path, not a directory.");
    }
    if (!force) {
      throw new Error("Output file already exists. Use --force to replace it.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return outputAbs;
}

async function buildMigration(
  inputPath: string,
  outputPath: string | undefined,
): Promise<MigrationResult> {
  const raw = await readFile(inputPath, "utf-8");
  const warnings: MigrationWarning[] = [];
  const sourceFormats: string[] = [];
  const migrated: PersistedInspectEvent[] = [];
  let validRows = 0;
  let skippedRows = 0;
  let lineNumber = 0;

  for (const line of raw.split(/\r?\n/)) {
    lineNumber += 1;
    const trimmed = line.trim();
    if (trimmed === "") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      skippedRows += 1;
      warnings.push({ line: lineNumber, message: "Skipped invalid JSON line." });
      continue;
    }

    const format = formatOf(parsed);
    if (format === "0.1") {
      if (!validateEvent(parsed)) {
        skippedRows += 1;
        warnings.push({ line: lineNumber, message: "Skipped invalid v0.1 trace row." });
        continue;
      }
      validRows += 1;
      sourceFormats.push(format);
      migrated.push(
        toSchema10(
          traceEventToPersistedInspectEvent(parsed, {
            eventIndex: validRows - 1,
            sourceName: "migrate",
            sourceVersion: "0.1",
          }),
        ),
      );
      continue;
    }

    if (format === "0.2" || format === "1.0") {
      if (!isPersistedInspectEvent(parsed)) {
        skippedRows += 1;
        warnings.push({
          line: lineNumber,
          message: `Skipped invalid v${format} persisted row.`,
        });
        continue;
      }
      validRows += 1;
      sourceFormats.push(format);
      migrated.push(toSchema10(parsed));
      continue;
    }

    skippedRows += 1;
    warnings.push({ line: lineNumber, message: "Skipped unsupported schemaVersion." });
  }

  if (migrated.length === 0) {
    throw new Error("No supported AgentInspect trace rows found to migrate.");
  }

  return {
    input: inputPath,
    output: outputPath,
    targetSchemaVersion: "1.0",
    sourceFormats: uniqueSorted(sourceFormats),
    validRows,
    outputRows: migrated.length,
    skippedRows,
    warnings,
    content: `${migrated.map((event) => JSON.stringify(event)).join("\n")}\n`,
  };
}

function printSummary(result: MigrationResult, dryRun: boolean): void {
  console.log("AgentInspect migration summary");
  console.log(`Input: ${result.input}`);
  console.log(`Target schemaVersion: ${result.targetSchemaVersion}`);
  console.log(`Source formats: ${result.sourceFormats.join(", ")}`);
  console.log(`Valid rows: ${result.validRows}`);
  console.log(`Output rows: ${result.outputRows}`);
  console.log(`Skipped rows: ${result.skippedRows}`);
  console.log(`Warnings: ${result.warnings.length}`);
  for (const warning of result.warnings) {
    console.log(`- line ${warning.line}: ${warning.message}`);
  }
  if (dryRun) {
    console.log("Dry run: no files written.");
  } else if (result.output !== undefined) {
    console.log(`Wrote migrated trace: ${result.output}`);
  }
}

export async function migrateCommand(
  input: string,
  options: MigrateCommandOptions = {},
): Promise<void> {
  try {
    parseTarget(options.to);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(input.trim());
  const dryRun = options.dryRun === true;
  if (!dryRun && (options.output === undefined || options.output.trim() === "")) {
    console.error("migrate requires --dry-run or --output <path>.");
    process.exitCode = 1;
    return;
  }

  try {
    const inputStats = await stat(inputPath);
    if (inputStats.isDirectory()) {
      throw new Error("Migration input must be a JSONL file, not a directory.");
    }

    const outputPath = await resolveOutputPath(
      inputPath,
      options.output,
      options.force === true,
    );
    const result = await buildMigration(inputPath, outputPath);

    if (!dryRun && outputPath !== undefined) {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, result.content, "utf-8");
    }

    printSummary(result, dryRun);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[AgentInspect] migrate failed: ${msg}`);
    process.exitCode = 1;
  }
}
