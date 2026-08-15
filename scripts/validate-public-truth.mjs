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

const factsPath = path.join(root, "docs/product/PUBLIC-PRODUCT-FACTS.json");
if (!existsSync(factsPath)) {
  failures.push("docs/product/PUBLIC-PRODUCT-FACTS.json is required");
} else {
  const facts = JSON.parse(readFileSync(factsPath, "utf8"));
  if (facts.version !== version) {
    failures.push(
      `PUBLIC-PRODUCT-FACTS.json version ${facts.version} must match root ${version}`,
    );
  }
  if (facts.publicPackageCount !== 18) {
    failures.push("PUBLIC-PRODUCT-FACTS.json publicPackageCount must be 18");
  }
  if (!facts.statusLine?.includes(version)) {
    failures.push(`PUBLIC-PRODUCT-FACTS.json statusLine must mention ${version}`);
  }
  if (!Array.isArray(facts.bannedPublicPhrases) || facts.bannedPublicPhrases.length < 5) {
    failures.push("PUBLIC-PRODUCT-FACTS.json must list bannedPublicPhrases");
  }
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
  if (/technical launch candidate/i.test(product)) {
    failures.push("apps/website/lib/product.ts must not use technical launch candidate");
  }
  if (/external pilot evidence pending/i.test(product)) {
    failures.push("apps/website/lib/product.ts must not use external pilot evidence pending");
  }
  if (!product.includes("Actively maintained")) {
    failures.push("apps/website/lib/product.ts releaseStatus should say Actively maintained");
  }
}

const readme = readFileSync(path.join(root, "README.md"), "utf8");
if (!readme.includes(`**${version}**`) && !readme.includes(`Current release:** **${version}**`)) {
  if (
    !new RegExp(`Current release:\\*\\* \\*\\*${version.replace(/\./g, "\\.")}`).test(readme) &&
    !readme.includes(`**${version}**`)
  ) {
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
  "docs/product/PUBLIC-PRODUCT-FACTS.md",
];
for (const rel of scanFiles) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  if (/aligned with .*v3\.5/i.test(text) || /as of v3\.5/i.test(text)) {
    failures.push(`${rel}: stale v3.5.x alignment claim`);
  }
  if (
    /\bCurrent release:\*\* \*\*6\.4\.0\b/.test(text) ||
    /Current release on npm:\*\* \*\*3\.5/.test(text)
  ) {
    failures.push(`${rel}: stale current-release claim`);
  }
}

// Strict bans on active public marketing / product surfaces
const strictSurfaces = [
  "apps/website/lib/product.ts",
  "apps/website/lib/site.ts",
  "apps/website/components/marketing/FAQ.tsx",
  "apps/website/public/llms.txt",
  "docs/README.md",
  "ROADMAP.md",
];
const earlyBans = [
  /technical launch candidate/i,
  /external pilot evidence pending/i,
  /stable launch candidate/i,
  /v7 not scheduled/i,
  /matchers are not shipped/i,
  /TraceContract matchers not shipped/i,
];
for (const rel of strictSurfaces) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  for (const ban of earlyBans) {
    if (ban.test(text)) {
      failures.push(`${rel}: banned phrase ${ban}`);
    }
  }
}

// README banned phrases (status section)
{
  const text = readFileSync(path.join(root, "README.md"), "utf8");
  for (const ban of [
    /technical launch candidate/i,
    /stable launch candidate/i,
    /external pilot evidence pending/i,
    /v7 not scheduled/i,
    /TraceContract matchers not shipped/i,
  ]) {
    if (ban.test(text)) failures.push(`README.md: banned phrase ${ban}`);
  }
}

const ledgerPath = path.join(root, "docs/product/PUBLIC-CLAIM-LEDGER.json");
if (!existsSync(ledgerPath)) {
  failures.push("docs/product/PUBLIC-CLAIM-LEDGER.json is required");
} else {
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  if (ledger.lastReviewedVersion !== version) {
    failures.push(
      `PUBLIC-CLAIM-LEDGER.json lastReviewedVersion ${ledger.lastReviewedVersion} must match root ${version}`,
    );
  }
  const banned = [
    ...(factsPath && existsSync(factsPath)
      ? JSON.parse(readFileSync(factsPath, "utf8")).bannedPublicPhrases ?? []
      : []),
    ...(ledger.bannedPhrases ?? []),
  ];
  const surfaces = [
    "README.md",
    "apps/website/lib/product.ts",
    "apps/website/components/marketing/Hero.tsx",
    "apps/website/public/llms.txt",
    "docs/GOLDEN-PATH.md",
    "docs/SCREENSHOTS.md",
  ];
  for (const rel of surfaces) {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, "utf8");
    for (const phrase of banned) {
      if (typeof phrase === "string" && phrase && text.includes(phrase)) {
        failures.push(`${rel}: banned claim phrase "${phrase}"`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("[public-truth:check] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`[public-truth:check] OK (version ${version}, ${fixed.length} fixed packages)`);
