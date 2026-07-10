/**
 * Public truth checks for version / package count / stale strings.
 * Run: node scripts/validate-public-truth.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const changeset = JSON.parse(readFileSync(path.join(root, ".changeset/config.json"), "utf8"));
const fixed = changeset.fixed?.[0] ?? [];
const version = pkg.version;
const failures = [];

if (fixed.length !== 18) {
  failures.push(`expected 18 fixed packages, found ${fixed.length}`);
}

const productPath = path.join(root, "apps/website/lib/product.ts");
if (existsSync(productPath)) {
  const product = readFileSync(productPath, "utf8");
  if (!product.includes(`version: "${version}"`)) {
    failures.push(`apps/website/lib/product.ts version must match root ${version}`);
  }
  if (!product.includes("publicPackageCount: 18")) {
    failures.push("apps/website/lib/product.ts publicPackageCount must be 18");
  }
}

const readme = readFileSync(path.join(root, "README.md"), "utf8");
if (!readme.includes(`**${version}**`) && !readme.includes(`Current release:** **${version}**`)) {
  // allow either form
  if (!new RegExp(`Current release:\\*\\* \\*\\*${version.replace(/\./g, "\\.")}`).test(readme) &&
      !readme.includes(`**${version}**`)) {
    failures.push(`README should mention current release ${version}`);
  }
}

// Stale public status strings outside historical contexts
const scanFiles = [
  "README.md",
  "ROADMAP.md",
  "docs/README.md",
  "docs/marketing/WEBSITE-COPY.md",
  "apps/website/lib/site.ts",
  "apps/website/lib/product.ts",
];
for (const rel of scanFiles) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  if (/aligned with .*v3\.5/i.test(text) || /as of v3\.5/i.test(text)) {
    failures.push(`${rel}: stale v3.5.x alignment claim`);
  }
  if (/\bCurrent release:\*\* \*\*6\.4\.0\b/.test(text) || /Current release on npm:\*\* \*\*3\.5/.test(text)) {
    failures.push(`${rel}: stale current-release claim`);
  }
}

if (failures.length > 0) {
  console.error("[public-truth:check] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`[public-truth:check] OK (version ${version}, ${fixed.length} fixed packages)`);
