import path from "node:path";

/**
 * Sanitizes a run id for bundle directory and asset filenames.
 * Strips path segments and replaces unsafe characters.
 */
export function sanitizeBundleRunId(runId: string): string {
  let safe =
    typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "run_unknown";
  safe = path.basename(safe);
  safe = safe.replace(/[^a-zA-Z0-9._-]+/g, "_");
  if (safe === "" || safe === "." || safe === "..") {
    safe = "run_unknown";
  }
  return safe;
}

/**
 * Relative POSIX path for a run asset inside a bundle directory.
 */
export function bundleRunAssetRelativePath(runId: string, extension: string): string {
  const safe = sanitizeBundleRunId(runId);
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return path.posix.join("assets", "runs", `${safe}${ext}`);
}

/**
 * Ensures a relative bundle path resolves inside the output directory.
 */
export function assertBundlePathContained(
  outputDir: string,
  relativePath: string,
): string {
  const base = path.resolve(outputDir);
  const resolved = path.resolve(base, relativePath);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`Bundle path escapes output directory: ${relativePath}`);
  }
  return resolved;
}

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
  const label =
    runIds.length === 1 ? sanitizeBundleRunId(runIds[0]!) : `multi-${runIds.length}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(`agent-inspect-bundle-${label}-${stamp}`);
}
