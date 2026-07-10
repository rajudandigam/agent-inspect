/**
 * Print public product data derived from manifests (for maintainers / CI).
 * Run: node scripts/generate-public-product-data.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const changeset = JSON.parse(readFileSync(path.join(root, ".changeset/config.json"), "utf8"));
const fixed = changeset.fixed?.[0] ?? [];

const data = {
  version: pkg.version,
  publicPackageCount: fixed.length,
  fixedPackages: fixed,
  description: pkg.description,
};

console.log(JSON.stringify(data, null, 2));
