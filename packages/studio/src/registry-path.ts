import { access } from "node:fs/promises";
import path from "node:path";

import { STUDIO_REGISTRY_FILENAMES } from "./registry.js";

export async function resolveStudioRegistryPath(options: {
  workspacePath?: string;
  cwd?: string;
}): Promise<string> {
  if (options.workspacePath && options.workspacePath.trim() !== "") {
    return path.resolve(options.cwd ?? process.cwd(), options.workspacePath);
  }
  const cwd = path.resolve(options.cwd ?? process.cwd());
  for (const rel of STUDIO_REGISTRY_FILENAMES) {
    const candidate = path.join(cwd, rel);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return path.join(cwd, STUDIO_REGISTRY_FILENAMES[0]!);
}
