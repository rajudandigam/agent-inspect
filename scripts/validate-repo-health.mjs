/**
 * Repository health gate for AgentInspect post-6.16 cleanup.
 * Run: node scripts/validate-repo-health.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function exists(rel) {
  return existsSync(path.join(root, rel));
}

function walkFiles(relDir, acc = []) {
  const abs = path.join(root, relDir);
  if (!existsSync(abs)) return acc;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      walkFiles(rel, acc);
    } else {
      acc.push(rel.replaceAll("\\", "/"));
    }
  }
  return acc;
}

// One canonical roadmap
if (!exists("docs/implementation/ROADMAP.md")) {
  failures.push("missing docs/implementation/ROADMAP.md");
}
const versionNamed = walkFiles("docs/implementation").filter((f) =>
  /AGENTINSPECT-CANONICAL-ROADMAP-V|ROADMAP-V6\.|ROADMAP_V3_/.test(f),
);
if (versionNamed.length) {
  failures.push(`version-named roadmaps still present: ${versionNamed.join(", ")}`);
}

// One active plan
if (!exists("docs/implementation/active/EXECUTION-PLAN.md")) {
  failures.push("missing docs/implementation/active/EXECUTION-PLAN.md");
}
if (exists("docs/implementation/release-trains")) {
  failures.push("docs/implementation/release-trains must not exist");
}

// No archive / issue drafts / OS junk
if (exists("docs/archive")) failures.push("docs/archive must not exist");
if (exists(".github/ISSUE_DRAFTS")) failures.push(".github/ISSUE_DRAFTS must not exist");
if (exists("docs/implementation/archive")) {
  failures.push("docs/implementation/archive must not exist");
}
const dsStore = walkFiles(".").filter((f) => f.endsWith(".DS_Store") || f.includes("/.DS_Store"));
// only check tracked via git ls-files style: if file exists at root
if (exists(".DS_Store")) failures.push("tracked/root .DS_Store must not exist");

// Proposals: only README allowed
const proposalFiles = walkFiles("docs/proposals").filter((f) => !f.endsWith("README.md"));
if (proposalFiles.length) {
  failures.push(`shipped proposals remain: ${proposalFiles.slice(0, 8).join(", ")}`);
}

// ADRs present
for (const adr of [
  "ADR-0001-local-first.md",
  "ADR-0002-schema-1.0.md",
  "ADR-0003-evidence-v2.md",
  "ADR-0004-tracefacts.md",
  "ADR-0005-no-default-network.md",
  "ADR-0006-fixed-package-group.md",
  "ADR-0007-package-tiers.md",
  "ADR-0008-canonical-docs-source.md",
]) {
  if (!exists(`docs/decisions/${adr}`)) failures.push(`missing docs/decisions/${adr}`);
}

// Changelog: single Unreleased
const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const unreleased = [...changelog.matchAll(/^## Unreleased\b/gm)];
if (unreleased.length !== 1) {
  failures.push(`expected exactly one ## Unreleased, found ${unreleased.length}`);
}

// Public version alignment (skip during npm lifecycle publish — docs sync lands after)
const skipVersionAlign =
  process.env.npm_lifecycle_event === "prepublishOnly" ||
  process.env.npm_lifecycle_event === "prepack" ||
  process.env.AGENT_INSPECT_REPO_HEALTH_SKIP_VERSION === "1";
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
if (!skipVersionAlign) {
  const docsReadme = readFileSync(path.join(root, "docs/README.md"), "utf8");
  if (!docsReadme.includes(`agent-inspect@${version}`)) {
    failures.push(`docs/README.md should mention current version ${version}`);
  }
  const rootReadme = readFileSync(path.join(root, "README.md"), "utf8");
  if (/6\.15 line is actively maintained/.test(rootReadme)) {
    failures.push("README still mentions stale 6.15 maintenance line");
  }
  if (/waiting for adoption|no adoption yet|pre-adoption|test phase/i.test(rootReadme)) {
    failures.push("README uses banned soft-launch / adoption-waiting language");
  }
} else {
  const rootReadme = readFileSync(path.join(root, "README.md"), "utf8");
  if (/waiting for adoption|no adoption yet|pre-adoption|test phase/i.test(rootReadme)) {
    failures.push("README uses banned soft-launch / adoption-waiting language");
  }
}

// Banned soft-launch phrases on key public facts
const facts = readFileSync(path.join(root, "docs/product/PUBLIC-PRODUCT-FACTS.md"), "utf8");
if (/waiting for adoption|no adoption yet/i.test(facts) && !/Banned public/.test(facts)) {
  failures.push("PUBLIC-PRODUCT-FACTS.md unexpectedly soft-launch framed");
}

// Package docs manifest
const manifestPath = path.join(root, "docs/product/PACKAGE-DOCS-MANIFEST.json");
if (!existsSync(manifestPath)) {
  failures.push("missing docs/product/PACKAGE-DOCS-MANIFEST.json");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const packedDocs = (pkg.files ?? []).filter((f) => f.startsWith("docs/"));
  const expected = new Set(manifest.docs ?? []);
  for (const f of packedDocs) {
    if (!expected.has(f)) failures.push(`package.json files packs unlisted doc: ${f}`);
  }
  for (const f of expected) {
    if (!packedDocs.includes(f)) failures.push(`manifest doc missing from package.json files: ${f}`);
    if (!exists(f)) failures.push(`manifest doc missing on disk: ${f}`);
  }
}

// Asset budget: no committed demo zip; showcase GIFs/posters stay bounded
for (const f of walkFiles("docs/assets")) {
  if (f.endsWith(".zip")) failures.push(`committed demo zip not allowed: ${f}`);
}
const showcase = "docs/assets/showcase";
if (exists(showcase)) {
  const provenance = path.join(showcase, "provenance.json");
  if (!exists(provenance)) failures.push("docs/assets/showcase/provenance.json is required");
  for (const f of walkFiles(showcase)) {
    const st = statSync(path.join(root, f));
    if (f.endsWith(".gif") && st.size > 1024 * 1024) {
      failures.push(`showcase GIF exceeds 1MB: ${f}`);
    }
    if (f.endsWith(".png") && st.size > 512 * 1024) {
      failures.push(`showcase PNG exceeds 512KB: ${f}`);
    }
    if ((f.endsWith(".webm") || f.endsWith(".mp4")) && st.size > 2 * 1024 * 1024) {
      failures.push(`showcase video exceeds 2MB: ${f}`);
    }
  }
}

// Duplicate AI maintainer handbook: no CODEX-MAINTAINER-GUIDE
if (exists("docs/implementation/CODEX-MAINTAINER-GUIDE.md")) {
  failures.push("duplicate CODEX-MAINTAINER-GUIDE.md must not exist");
}

if (failures.length) {
  console.error("[repo:health] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`[repo:health] OK (version ${version})`);
