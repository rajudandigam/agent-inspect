/**
 * Fail when fixed/linked public package versions drift from the release line.
 * Run from repo root: pnpm run linked-versions:check
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, ".changeset/config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

function fail(message, detail) {
  console.error(`[linked-versions:check] ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function collectPackageManifests() {
  const manifests = new Map();
  const rootManifestPath = path.join(root, "package.json");
  const rootPkg = JSON.parse(readFileSync(rootManifestPath, "utf8"));
  manifests.set(rootPkg.name, rootManifestPath);

  const packagesDir = path.join(root, "packages");
  if (!existsSync(packagesDir)) return manifests;

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packagesDir, entry.name, "package.json");
    if (!existsSync(manifestPath)) continue;
    const pkg = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (typeof pkg.name === "string") {
      manifests.set(pkg.name, manifestPath);
    }
  }

  return manifests;
}

function readVersion(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, "utf8")).version;
}

const groups = [...(config.fixed ?? []), ...(config.linked ?? [])];
if (groups.length === 0) {
  console.log("[linked-versions:check] no fixed or linked groups configured");
  process.exit(0);
}

const manifests = collectPackageManifests();
const expectedVersion = readVersion(path.join(root, "package.json"));
const mismatches = [];

for (const [groupIndex, group] of groups.entries()) {
  for (const packageName of group) {
    const manifestPath = manifests.get(packageName);
    if (!manifestPath) {
      fail(`package not found in workspace: ${packageName}`, `group index ${groupIndex}`);
    }
    const version = readVersion(manifestPath);
    if (version !== expectedVersion) {
      mismatches.push({ packageName, version, manifestPath });
    }
  }
}

if (mismatches.length > 0) {
  const lines = mismatches.map(
    (item) => `- ${item.packageName}: ${item.version} (expected ${expectedVersion})`,
  );
  fail(
    `release line drift detected (${mismatches.length} package(s))`,
    lines.join("\n"),
  );
}

console.log(
  `[linked-versions:check] OK: ${groups.flat().length} grouped package(s) aligned at ${expectedVersion}`,
);
