import path from "node:path";

export function isSafeRelativePath(p: string): boolean {
  const trimmed = p.trim();
  if (trimmed === "" || trimmed.startsWith("/") || trimmed.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(trimmed)) return false;
  return !trimmed.split(/[/\\]+/).some((seg) => seg === "..");
}

export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...segments);
  assertPathUnderRoot(resolved, resolvedRoot);
  return resolved;
}

export function assertPathUnderRoot(resolved: string, root: string): void {
  const rel = path.relative(path.resolve(root), path.resolve(resolved));
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("path escapes allowed registry root");
  }
}
