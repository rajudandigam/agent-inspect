import type { Stats } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { getDefaultTraceDir } from "./utils.js";

export interface TraceDirectoryOptions {
  dir?: string;
}

export class TraceDirectory {
  readonly #dir: string;

  constructor(options: TraceDirectoryOptions = {}) {
    this.#dir =
      typeof options.dir === "string" && options.dir.trim() !== ""
        ? options.dir.trim()
        : getDefaultTraceDir();
  }

  getPath(filename?: string): string {
    return filename ? path.join(this.#dir, filename) : this.#dir;
  }

  async list(): Promise<string[]> {
    try {
      const files = await readdir(this.#dir);
      return files.filter((f) => f.endsWith(".jsonl"));
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
        return [];
      }
      throw e;
    }
  }

  async getFileStats(filename: string): Promise<Stats> {
    return await stat(this.getPath(filename));
  }
}

