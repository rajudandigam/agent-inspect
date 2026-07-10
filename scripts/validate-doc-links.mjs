/**
 * Check relative markdown links in key public docs resolve on disk.
 * Run: node scripts/validate-doc-links.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  "docs/README.md",
  "docs/FIRST-TRACE-IN-5-MINUTES.md",
  "docs/SUPPORT-LEVELS.md",
  "docs/NETWORK-BEHAVIOR.md",
  "docs/TRACE-CONTRACTS.md",
  "docs/SUITES-COHORTS-GATES.md",
  "docs/GOLDEN-PATH.md",
  "docs/SESSIONS-AND-OUTCOMES.md",
];

const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
const failures = [];

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) {
    failures.push(`missing file: ${rel}`);
    continue;
  }
  const text = readFileSync(abs, "utf8");
  const dir = path.dirname(abs);
  let m;
  while ((m = linkRe.exec(text))) {
    const href = m[2].split("#")[0].split("?")[0];
    if (!href || href.startsWith("http") || href.startsWith("mailto:")) continue;
    if (href.startsWith("/")) continue;
    const target = path.resolve(dir, href);
    if (!existsSync(target)) {
      failures.push(`${rel}: broken relative link ${href}`);
    }
  }
}

// Root package.json files must include docs linked relatively from README for npm
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const packed = new Set(pkg.files ?? []);
const readme = readFileSync(path.join(root, "README.md"), "utf8");
const relDocLinks = [...readme.matchAll(/\]\((docs\/[^)#\s]+)\)/g)].map((x) => x[1]);
for (const doc of relDocLinks) {
  if (!packed.has(doc) && !packed.has(doc.replace(/^\.\//, ""))) {
    // relative docs/ links in README that are not packed are a risk
    failures.push(`README relative docs link not in package.json files: ${doc}`);
  }
}

if (failures.length > 0) {
  console.error("[docs:links] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`[docs:links] OK (${files.length} docs + README packed-files check)`);
