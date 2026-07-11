/**
 * Check relative markdown links in key public docs resolve on disk, and that
 * active public docs do not link into archived or internal-only guidance.
 * Run: node scripts/validate-doc-links.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findArchivedLinkViolations } from "./lib/archived-link-rule.mjs";

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

// Active public docs must not link into archived/internal-only guidance.
// Scope: root contributor entry points plus every markdown doc outside
// docs/archive (implementation/proposal notes cite history on purpose and
// stay exempt).
function collectActivePublicDocs() {
  const entries = [];
  const rootDocs = ["README.md", "CONTRIBUTING.md", "GOOD-FIRST-ISSUES.md", "ROADMAP.md"];
  for (const rel of rootDocs) {
    const abs = path.join(root, rel);
    if (existsSync(abs)) entries.push({ source: rel, text: readFileSync(abs, "utf8") });
  }
  const skipPrefixes = ["docs/archive/", "docs/implementation/", "docs/proposals/"];
  const walk = (dirRel) => {
    for (const ent of readdirSync(path.join(root, dirRel), { withFileTypes: true })) {
      const rel = `${dirRel}/${ent.name}`;
      if (skipPrefixes.some((prefix) => rel.startsWith(prefix) || `${rel}/`.startsWith(prefix))) {
        continue;
      }
      if (ent.isDirectory()) walk(rel);
      else if (ent.name.endsWith(".md")) {
        entries.push({ source: rel, text: readFileSync(path.join(root, rel), "utf8") });
      }
    }
  };
  walk("docs");
  return entries;
}

const activeDocs = collectActivePublicDocs();
for (const violation of findArchivedLinkViolations(activeDocs)) {
  failures.push(
    `${violation.source}: links into archived/internal path ${violation.target} (${violation.href})`,
  );
}

if (failures.length > 0) {
  console.error("[docs:links] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(
  `[docs:links] OK (${files.length} docs + README packed-files check + archived-link rule over ${activeDocs.length} active docs)`,
);
