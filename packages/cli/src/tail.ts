import { open, stat } from "node:fs/promises";
import { stdin as input } from "node:process";

import type { ParserWarning, ParserWarningCode } from "@agent-inspect/core";
import {
  LiveLogAccumulator,
  loadLogIngestConfig,
  mergeLogIngestConfig,
  renderRunTrees,
} from "@agent-inspect/core";
import type { LogIngestConfig } from "@agent-inspect/core";

export interface TailOptions {
  file?: string;
  format?: "auto" | "json" | "log4js";
  config?: string;
  runIdKey?: string;
  eventKey?: string;
  timestampKey?: string;
  messageKey?: string;
  levelKey?: string;
  parentIdKey?: string;
  durationKey?: string;
  statusKey?: string;
  warnings?: "summary" | "all" | "none";
  refresh?: string;
  once?: boolean;
  json?: boolean;
  noClear?: boolean;
  color?: boolean;
}

function parseRunIdKeys(raw?: string): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  return parts.length > 0 ? parts : undefined;
}

function parseRefreshMs(raw?: string): number {
  const fallback = 250;
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid --refresh value: ${raw}. Provide a positive integer (ms).`);
  }
  return n;
}

function summarizeWarnings(warnings: ParserWarning[]): Record<ParserWarningCode, number> {
  const out = {} as Record<ParserWarningCode, number>;
  for (const w of warnings) {
    out[w.code] = (out[w.code] ?? 0) + 1;
  }
  return out;
}

function formatWarningLine(w: ParserWarning): string {
  const loc =
    w.line !== undefined
      ? `line ${w.line}`
      : w.file
        ? "file"
        : "unknown";
  return `- ${loc} ${w.code}: ${w.message}`;
}

function clearScreen(): void {
  // Clear screen + move cursor to 0,0
  process.stdout.write("\x1b[2J\x1b[0f");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* readStdinLines(): AsyncGenerator<string> {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      yield line;
    }
  } finally {
    rl.close();
  }
}

async function readFileOnce(
  filePath: string,
  onLine: (line: string, lineNumber: number) => void,
): Promise<void> {
  // Read full file and split into lines. This is acceptable for --once.
  const fh = await open(filePath, "r");
  try {
    const text = await fh.readFile({ encoding: "utf-8" });
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      onLine(line, i + 1);
    }
  } finally {
    await fh.close();
  }
}

async function followFile(
  filePath: string,
  options: { refreshMs: number; once: boolean },
  onLine: (line: string, lineNumber: number) => void,
  shouldStop: () => boolean,
): Promise<void> {
  // Tail -f semantics: start at end of file.
  let pos = 0;
  let lineNumber = 0;
  let carry = "";

  const st = await stat(filePath);
  if (options.once) {
    await readFileOnce(filePath, onLine);
    return;
  }

  pos = st.size;

  while (!shouldStop()) {
    let next;
    try {
      next = await stat(filePath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to stat file: ${filePath} (${msg})`);
    }

    if (next.size > pos) {
      const fh = await open(filePath, "r");
      try {
        const len = next.size - pos;
        const buf = Buffer.allocUnsafe(Number(len));
        const { bytesRead } = await fh.read(buf, 0, buf.length, pos);
        pos += bytesRead;

        const chunk = carry + buf.toString("utf-8", 0, bytesRead);
        const parts = chunk.split(/\r?\n/);
        carry = parts.pop() ?? "";

        for (const p of parts) {
          lineNumber += 1;
          onLine(p, lineNumber);
        }
      } finally {
        await fh.close();
      }
    }

    await sleep(options.refreshMs);
  }
}

export async function tail(options: TailOptions = {}): Promise<void> {
  try {
    const warningsMode = options.warnings ?? "summary";
    if (warningsMode !== "none" && warningsMode !== "summary" && warningsMode !== "all") {
      console.error(`Invalid --warnings value: ${String(options.warnings)}`);
      process.exitCode = 1;
      return;
    }

    const refreshMs = parseRefreshMs(options.refresh);

    const cfgBase = await loadLogIngestConfig(options.config);
    const override: Partial<LogIngestConfig> = {};
    const runIdKeys = parseRunIdKeys(options.runIdKey);
    if (runIdKeys !== undefined) override.runIdKeys = runIdKeys;
    for (const k of [
      "eventKey",
      "timestampKey",
      "messageKey",
      "levelKey",
      "parentIdKey",
      "durationKey",
      "statusKey",
    ] as const) {
      const v = (options as any)[k];
      if (v !== undefined) (override as any)[k] = v;
    }

    const config = mergeLogIngestConfig(cfgBase, override);

    const format = options.format ?? "auto";
    const filePath = typeof options.file === "string" && options.file.trim() !== ""
      ? options.file.trim()
      : undefined;

    const acc = new LiveLogAccumulator({
      config,
      format,
      file: filePath ?? "stdin",
    });

    const isTty = Boolean(process.stdout.isTTY);
    const doClear = isTty && options.noClear !== true;

    let stop = false;
    const shouldStop = () => stop;
    const onSigInt = () => {
      stop = true;
    };
    process.once("SIGINT", onSigInt);

    let dirty = false;
    let lastRenderedKey = "";
    let waitingShown = false;

    const renderNow = () => {
      const events = acc.getEvents();
      const trees = acc.getTrees();
      const warnings = acc.getWarnings();

      const summary = {
        runs: trees.length,
        events: events.length,
        warnings: warnings.length,
      };

      if (options.json) {
        const payload =
          warningsMode === "none"
            ? { events, trees, warnings: [], summary }
            : { events, trees, warnings, summary };
        process.stdout.write(JSON.stringify(payload) + "\n");
        return;
      }

      if (doClear) clearScreen();

      if (!waitingShown && events.length === 0 && isTty) {
        console.log("Waiting for logs...");
        waitingShown = true;
      }

      if (trees.length > 0) {
        const text = renderRunTrees(trees, { summary: true, showConfidence: "always" });
        console.log(text);
      }

      if (warningsMode === "none") return;

      console.log("");
      console.log("Warnings:");
      console.log(`  Total: ${warnings.length}`);
      if (warningsMode === "summary") {
        const counts = summarizeWarnings(warnings);
        for (const [code, count] of Object.entries(counts)) {
          console.log(`  ${code}: ${count}`);
        }
      } else {
        for (const w of warnings) console.log(formatWarningLine(w));
      }
    };

    const renderLoop = async () => {
      while (!shouldStop()) {
        if (dirty) {
          // Avoid re-rendering identical state when no new events/warnings.
          const key = `${acc.getEvents().length}:${acc.getWarnings().length}:${acc.getTrees().length}`;
          if (key !== lastRenderedKey) {
            lastRenderedKey = key;
            renderNow();
          }
          dirty = false;
        }
        await sleep(refreshMs);
      }
    };

    const renderTask = renderLoop();

    const onLine = (line: string, lineNumber: number) => {
      acc.pushLine(line, lineNumber);
      dirty = true;
    };

    let endedNaturally = false;

    if (filePath) {
      // Fail clearly if file does not exist.
      try {
        await stat(filePath);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Log file does not exist: ${filePath} (${msg})`);
        process.exitCode = 1;
        stop = true;
        return;
      }

      await followFile(
        filePath,
        { refreshMs, once: options.once === true },
        onLine,
        shouldStop,
      );
      endedNaturally = options.once === true;
    } else {
      let lineNumber = 0;
      for await (const line of readStdinLines()) {
        lineNumber += 1;
        onLine(line, lineNumber);
        if (shouldStop()) break;
      }
      endedNaturally = !shouldStop();
      stop = true;
    }

    // Final render on exit.
    dirty = true;
    renderNow();

    if (endedNaturally && acc.getEvents().length === 0) {
      if (!options.json) {
        console.error("No valid events found.");
      }
      process.exitCode = 1;
    }

    stop = true;
    await renderTask;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] tail failed: ${msg}`);
    process.exitCode = 1;
  }
}

