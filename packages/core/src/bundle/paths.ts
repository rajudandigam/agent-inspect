import path from "node:path";

/**
 * Normalizes bundle output path. Strips a `.zip` suffix (folder-first MVP).
 */
export function normalizeBundleOutputPath(out: string): string {
  const trimmed = out.trim();
  if (trimmed === "") {
    throw new Error("--out requires a non-empty path.");
  }
  const resolved = path.resolve(trimmed);
  if (resolved.toLowerCase().endsWith(".zip")) {
    return resolved.slice(0, -4);
  }
  return resolved;
}

/**
 * Default bundle directory when --out is omitted.
 */
export function defaultBundleOutputPath(runIds: readonly string[]): string {
  const label = runIds.length === 1 ? runIds[0]! : `multi-${runIds.length}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(`agent-inspect-bundle-${label}-${stamp}`);
}
