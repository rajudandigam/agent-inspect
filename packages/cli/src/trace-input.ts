import { stat } from "node:fs/promises";

import { getTraceFilePath, resolveTraceDir } from "@agent-inspect/core";
import type { TraceInput } from "@agent-inspect/core/readers";

export interface TraceTargetOptions {
  dir?: string;
}

export async function readStdin(stdin: NodeJS.ReadableStream): Promise<string> {
  stdin.setEncoding("utf8");
  let content = "";
  for await (const chunk of stdin) {
    content += typeof chunk === "string" ? chunk : String(chunk);
  }
  return content;
}

function isMissingFileError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export async function inputFromTarget(
  target: string,
  options: TraceTargetOptions,
  stdin: NodeJS.ReadableStream,
): Promise<TraceInput> {
  if (target === "-") {
    return { type: "string", content: await readStdin(stdin) };
  }

  try {
    const stats = await stat(target);
    if (stats.isDirectory()) return { type: "directory", path: target };
    return { type: "file", path: target };
  } catch (error) {
    if (!isMissingFileError(error)) throw error;
  }

  const runPath = getTraceFilePath(target, resolveTraceDir({ dir: options.dir }));
  const stats = await stat(runPath);
  if (stats.isDirectory()) return { type: "directory", path: runPath };
  return { type: "file", path: runPath };
}
