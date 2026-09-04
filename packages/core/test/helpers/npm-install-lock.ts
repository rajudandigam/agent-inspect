import { closeSync, openSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const lockPath = path.join(tmpdir(), "agent-inspect-npm-install.lock");

function sleepMs(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy-wait: sync lock wait without adding deps */
  }
}

/**
 * Serialize local `npm install <repo>` across Vitest workers.
 * Concurrent installs of the same workspace path hang/flake under coverage.
 */
export function withNpmInstallLock<T>(fn: () => T): T {
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    let fd: number | undefined;
    try {
      fd = openSync(lockPath, "wx");
    } catch {
      sleepMs(100);
      continue;
    }
    try {
      return fn();
    } finally {
      closeSync(fd);
      try {
        unlinkSync(lockPath);
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error(`Timed out waiting for npm install lock at ${lockPath}`);
}
