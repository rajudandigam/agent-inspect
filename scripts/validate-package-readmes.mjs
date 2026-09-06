/**
 * Package README <-> SUPPORT-LEVELS / NETWORK-BEHAVIOR consistency.
 * Run: node scripts/validate-package-readmes.mjs
 *
 * A package README is the first thing a user reads on npm, and it is the copy
 * least likely to be updated when a surface is promoted or its network
 * behavior changes. This check makes the canonical docs the source of truth and
 * fails when a README drifts from them.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSupportMatrixLevels,
  supportLevelDisagreement,
} from "./lib/package-readme-support-rule.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const supportLevelsRel = "docs/SUPPORT-LEVELS.md";
const networkBehaviorRel = "docs/NETWORK-BEHAVIOR.md";
const supportLevels = readFileSync(path.join(root, supportLevelsRel), "utf8");
const networkBehavior = readFileSync(path.join(root, networkBehaviorRel), "utf8");

/** The Definitions table is the only list of legal levels. */
const canonicalLevels = new Set(
  [...supportLevels.matchAll(/^\|\s*\*\*(\w+)\*\*\s*\|/gm)].map((m) => m[1]),
);
if (canonicalLevels.size === 0) {
  failures.push(`${supportLevelsRel}: could not parse the Definitions table`);
}

const matrixLevels = buildSupportMatrixLevels(supportLevels);

/**
 * Surfaces NETWORK-BEHAVIOR.md records as making network calls.
 *
 * Most rows name their package in backticks. A few name the surface in prose
 * ("MCP server", "Studio HTTP ingest"), so those are mapped explicitly here --
 * a loose text match would bind "Viewer" to any package whose README happens to
 * use the word. When a row's surface is prose-named, add it to this map.
 */
const PROSE_SURFACE_PACKAGES = {
  "MCP server": "@agent-inspect/mcp-server",
  "Studio CLI": "@agent-inspect/studio",
  "Studio file-drop ingest": "@agent-inspect/studio",
  "Studio GitHub artifact import": "@agent-inspect/studio",
  "Studio HTTP ingest": "@agent-inspect/studio",
  Viewer: "@agent-inspect/viewer",
};

const networkedPackages = new Set();
for (const [, surface, network] of networkBehavior.matchAll(/^\|\s*([^|]+?)\s*\|[^|]*\|\s*([^|]+?)\s*\|/gm)) {
  if (/^no\b/i.test(network)) continue;
  for (const [, name] of surface.matchAll(/`(@?[a-z0-9/@-]+)`/g)) networkedPackages.add(name);
  const prose = PROSE_SURFACE_PACKAGES[surface.replace(/\*\*/g, "").trim()];
  if (prose) networkedPackages.add(prose);
}

const ABSOLUTE_NO_NETWORK =
  /\b(no network(?! behavior)|never (?:makes|sends)[^.]*network|zero network|fully offline|completely offline|works entirely offline)\b/i;

/**
 * The public fixed group from .changeset/config.json -- the packages that
 * actually ship to npm, and so the ones whose README is a public claim. The
 * in-repo VS Code extension is deliberately outside it: it is not published,
 * so an npm-facing support level would be a claim about nothing.
 */
const fixedGroup = new Set(
  JSON.parse(readFileSync(path.join(root, ".changeset/config.json"), "utf8")).fixed?.[0] ?? [],
);
if (fixedGroup.size === 0) failures.push(".changeset/config.json: no fixed package group found");

const readmes = [];
const skipped = [];
for (const dir of readdirSync(path.join(root, "packages"))) {
  const pkgPath = path.join(root, "packages", dir, "package.json");
  const readmePath = path.join(root, "packages", dir, "README.md");
  if (!existsSync(pkgPath) || !existsSync(readmePath)) continue;
  const name = JSON.parse(readFileSync(pkgPath, "utf8")).name;
  const entry = {
    name,
    rel: path.posix.join("packages", dir, "README.md"),
    text: readFileSync(readmePath, "utf8"),
  };
  if (fixedGroup.has(name)) readmes.push(entry);
  else skipped.push(name);
}
if (readmes.length === 0) failures.push("no fixed-group package READMEs found under packages/");

for (const { name, rel, text } of readmes) {
  const declared = text.match(/\*\*Support level:\*\*\s*(\w+)/);

  if (!declared) {
    failures.push(
      `${rel}: no "**Support level:** <Level>" line. Add one naming a level from ` +
        `${supportLevelsRel}, so the npm page states the same maturity the docs do.`,
    );
  } else {
    const level = declared[1];

    if (!canonicalLevels.has(level)) {
      failures.push(
        `${rel}: support level "${level}" is not one of ${[...canonicalLevels].join(", ")} ` +
          `(${supportLevelsRel} Definitions).`,
      );
    }

    const disagreement = supportLevelDisagreement(matrixLevels, name, level);
    if (disagreement) {
      failures.push(
        `${rel}: declares "${level}" but ${supportLevelsRel} rates it "${disagreement.level}" ` +
          `via the row "${disagreement.label}". Change the README, or promote the package in ` +
          `${supportLevelsRel} — they must not disagree.`,
      );
    }

    if (!/SUPPORT-LEVELS\.md/.test(text)) {
      failures.push(
        `${rel}: states a support level but never links ${supportLevelsRel}, so a reader ` +
          `cannot see what "${level}" promises.`,
      );
    }
  }

  const claim = text.match(ABSOLUTE_NO_NETWORK);
  if (claim) {
    if (networkedPackages.has(name)) {
      failures.push(
        `${rel}: claims "${claim[0]}" but ${networkBehaviorRel} records this surface as ` +
          `making network calls. Qualify the claim with when network happens.`,
      );
    } else if (!/NETWORK-BEHAVIOR\.md/.test(text)) {
      failures.push(
        `${rel}: makes the absolute claim "${claim[0]}" without linking ` +
          `${networkBehaviorRel}, which is where that guarantee is defined.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(
    "[package-readmes:check] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}

/**
 * Reported, not failed: a package whose level rests only on its own README,
 * because no SUPPORT-LEVELS.md row names it. Nothing is wrong with the README
 * -- the canonical matrix is the side with the gap -- so this is the update
 * path made visible rather than a blocked build. Add a row naming the package
 * and this check starts enforcing agreement for it.
 */
const ungoverned = readmes
  .filter(({ name }) => !matrixLevels.has(name))
  .map(({ name }) => name)
  .sort();

console.log(
  `[package-readmes:check] OK (${readmes.length} fixed-group package READMEs` +
    (skipped.length > 0 ? `, ${skipped.length} unpublished skipped: ${skipped.sort().join(", ")}` : "") +
    ")",
);
if (ungoverned.length > 0) {
  console.log(
    `[package-readmes:check] note: ${ungoverned.length} package(s) declare a level that ` +
      `${supportLevelsRel} does not name, so it is unenforced: ${ungoverned.join(", ")}`,
  );
}
