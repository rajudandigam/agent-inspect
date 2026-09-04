import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

function relativePath(repositoryRoot, filePath) {
  return path.relative(repositoryRoot, filePath).replaceAll("\\", "/");
}

/** Build a package-name index from the root and packages/* manifests. */
export function buildPackageManifestIndex(repositoryRoot) {
  const manifestPaths = [path.join(repositoryRoot, "package.json")];
  const packagesDir = path.join(repositoryRoot, "packages");

  if (existsSync(packagesDir)) {
    for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(packagesDir, entry.name, "package.json");
      if (existsSync(manifestPath)) manifestPaths.push(manifestPath);
    }
  }

  const manifestsByName = new Map();
  for (const manifestPath of manifestPaths) {
    if (!existsSync(manifestPath)) continue;
    const name = JSON.parse(readFileSync(manifestPath, "utf8")).name;
    if (typeof name !== "string" || name.length === 0) continue;

    const manifests = manifestsByName.get(name) ?? [];
    manifests.push({
      manifestPath,
      packageDir: path.dirname(manifestPath),
    });
    manifestsByName.set(name, manifests);
  }

  return manifestsByName;
}

/** Resolve every fixed member to exactly one manifest and adjacent README. */
export function resolveFixedGroupReadmes({
  repositoryRoot,
  fixedGroup,
  manifestIndex,
}) {
  const failures = [];
  const readmes = [];

  for (const name of fixedGroup) {
    const manifests = manifestIndex.get(name) ?? [];
    if (manifests.length === 0) {
      failures.push(
        `Fixed-group package resolution is incomplete: ${name}: no repository package.json declares this package name`,
      );
      continue;
    }

    if (manifests.length > 1) {
      const paths = manifests
        .map(({ manifestPath }) => relativePath(repositoryRoot, manifestPath))
        .sort()
        .join(", ");
      failures.push(`Duplicate package identity: ${name}: ${paths}`);
      continue;
    }

    const readmePath = path.join(manifests[0].packageDir, "README.md");
    const rel = relativePath(repositoryRoot, readmePath);
    if (!existsSync(readmePath)) {
      failures.push(
        `Fixed-group README coverage is incomplete: ${name}: ${rel} was not found`,
      );
      continue;
    }

    readmes.push({ name, rel, text: readFileSync(readmePath, "utf8") });
  }

  const resolvedNames = new Set(readmes.map(({ name }) => name));
  const missing = [...fixedGroup]
    .filter((name) => !resolvedNames.has(name))
    .sort();
  const unexpected = [...resolvedNames]
    .filter((name) => !fixedGroup.has(name))
    .sort();
  if (missing.length > 0 || unexpected.length > 0) {
    failures.push(
      "Fixed-group README coverage mismatch:" +
        (missing.length > 0 ? ` missing ${missing.join(", ")}` : "") +
        (unexpected.length > 0 ? ` unexpected ${unexpected.join(", ")}` : ""),
    );
  }

  return { failures, readmes };
}

/** Preserve visible skips for discovered, non-fixed packages with READMEs. */
export function listVisibleNonFixedPackages({ fixedGroup, manifestIndex }) {
  return [...manifestIndex]
    .filter(([name, manifests]) => {
      if (fixedGroup.has(name) || manifests.length !== 1) return false;
      return existsSync(path.join(manifests[0].packageDir, "README.md"));
    })
    .map(([name]) => name)
    .sort();
}

export function listUngovernedPackages({ readmes, matrixLevels }) {
  return readmes
    .filter(({ name }) => !matrixLevels.has(name))
    .map(({ name }) => name)
    .sort();
}
