/**
 * Fail when public docs/README contain known-invalid CLI command patterns.
 * Run: node scripts/validate-doc-commands.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const patterns = [
  {
    name: "verify-safe without target",
    re: /agent-inspect\s+verify-safe\s+--dir\b/,
  },
  {
    name: "redact with only --dir (missing target)",
    re: /agent-inspect\s+redact\s+--profile\s+\w+\s+--dir\b/,
  },
];

const roots = [
  "README.md",
  "docs",
  "apps/website/components",
  "apps/website/lib",
  "docs/marketing",
];

function walk(dir, out = []) {
  const full = path.join(root, dir);
  let st;
  try {
    st = statSync(full);
  } catch {
    return out;
  }
  if (st.isFile()) {
    out.push(dir);
    return out;
  }
  for (const entry of readdirSync(full)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const rel = path.join(dir, entry);
    const child = path.join(root, rel);
    const cst = statSync(child);
    if (cst.isDirectory()) walk(rel, out);
    else if (/\.(md|tsx|ts|mjs|jsx)$/.test(entry)) out.push(rel);
  }
  return out;
}

const files = roots.flatMap((r) => walk(r));
const failures = [];

for (const rel of files) {
  const text = readFileSync(path.join(root, rel), "utf8");
  // Allow mentions inside audit docs that describe the bug
  if (rel.includes("V6.7.1-DOCS-WEBSITE-PRESENTATION-AUDIT")) continue;
  for (const pattern of patterns) {
    if (pattern.re.test(text)) {
      failures.push(`${rel}: ${pattern.name}`);
    }
  }
}

if (failures.length > 0) {
  console.error("[docs:commands] invalid command patterns:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`[docs:commands] OK (${files.length} files scanned)`);
