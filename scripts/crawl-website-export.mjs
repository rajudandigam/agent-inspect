#!/usr/bin/env node
/**
 * Crawl a Next static export (apps/website/out) for broken same-origin
 * hrefs, fragments, and local media references.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, "apps/website/out");

if (!existsSync(outDir)) {
  console.error(`Export directory missing: ${outDir}`);
  process.exit(1);
}

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkHtml(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function collectIds(html) {
  const ids = new Set();
  const re = /\bid=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

function resolveLocal(fromHtmlFile, href) {
  const pageUrl = (() => {
    const relFromOut = path.relative(outDir, fromHtmlFile).replace(/\\/g, "/");
    return new URL(relFromOut.split("/").map(encodeURIComponent).join("/"), "https://example.local/");
  })();

  const { pathname, hash } = (() => {
    try {
      // Resolve relative hrefs against the exporting page, not the site root.
      // Using only https://example.local/ as the base made `../missing` and
      // nested-relative targets incorrectly fall back to root files.
      const u = new URL(href, pageUrl);
      return {
        pathname: decodeURIComponent(u.pathname),
        hash: decodeURIComponent(u.hash.replace(/^#/, "")),
      };
    } catch {
      return { pathname: href, hash: "" };
    }
  })();

  if (!pathname || pathname.startsWith("mailto:") || pathname.startsWith("tel:")) {
    return { skip: true };
  }

  // Absolute URL to another host
  if (/^https?:\/\//i.test(href) && !href.includes("example.local")) {
    return { skip: true };
  }

  let rel = pathname;
  if (rel.startsWith("/")) {
    rel = rel.slice(1);
  } else {
    const fromDir = path.dirname(path.relative(outDir, fromHtmlFile));
    rel = path.posix.normalize(path.posix.join(fromDir.replace(/\\/g, "/"), rel));
  }

  // Reject path escape above the export root (e.g. excessive ../).
  if (rel.startsWith("..")) {
    return { skip: false, found: undefined, hash, candidates: [] };
  }

  // Trailing-slash export: /docs/foo/ → docs/foo/index.html
  const candidates = [];
  if (rel.endsWith("/")) {
    candidates.push(path.join(outDir, rel, "index.html"));
  } else if (rel.endsWith(".html") || rel.endsWith(".md") || /\.[a-z0-9]+$/i.test(rel)) {
    candidates.push(path.join(outDir, rel));
  } else {
    candidates.push(path.join(outDir, rel));
    candidates.push(path.join(outDir, `${rel}.html`));
    candidates.push(path.join(outDir, rel, "index.html"));
  }

  const found = candidates.find((c) => existsSync(c));
  if (!found) {
    return { skip: false, found: undefined, hash, candidates };
  }
  const st = statSync(found);
  if (st.isDirectory()) {
    const indexHtml = path.join(found, "index.html");
    if (existsSync(indexHtml)) {
      return { skip: false, found: indexHtml, hash, candidates };
    }
    return { skip: false, found: undefined, hash, candidates };
  }
  return { skip: false, found, hash, candidates };
}

const htmlFiles = walkHtml(outDir);
const failures = [];
let checked = 0;

// Flight payloads must not ship — they look like human docs at /docs/index.txt.
function collectFlightTxt(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) collectFlightTxt(abs, acc);
    else if (name === "index.txt") acc.push(path.relative(outDir, abs));
  }
  return acc;
}

const flightTxt = collectFlightTxt(outDir);
if (flightTxt.length) {
  console.error(
    `Website export crawl failed: ${flightTxt.length} Flight index.txt file(s) remain (run strip-website-flight-txt):`,
  );
  for (const f of flightTxt.slice(0, 20)) console.error(`- ${f}`);
  process.exit(1);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  // Skip RSC flight payloads mistaken as human pages — they are .txt not .html.
  const ids = collectIds(html);
  const hrefRe = /\b(?:href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (
      href.startsWith("data:") ||
      href.startsWith("javascript:") ||
      href.startsWith("#")
    ) {
      if (href.startsWith("#") && href.length > 1) {
        const id = decodeURIComponent(href.slice(1));
        if (!ids.has(id)) {
          failures.push({
            file: path.relative(outDir, file),
            href,
            reason: `missing fragment #${id}`,
          });
        }
        checked++;
      }
      continue;
    }

    const resolved = resolveLocal(file, href);
    if (resolved.skip) continue;
    checked++;

    if (!resolved.found) {
      // RSC / Next data routes and known optional assets — soft-skip _next only when missing is unexpected;
      // _next assets should exist after build.
      failures.push({
        file: path.relative(outDir, file),
        href,
        reason: `missing target (tried ${resolved.candidates.map((c) => path.relative(outDir, c)).join(", ")})`,
      });
      continue;
    }

    if (resolved.hash) {
      const targetHtml = readFileSync(resolved.found, "utf8");
      const targetIds = collectIds(targetHtml);
      if (!targetIds.has(resolved.hash)) {
        failures.push({
          file: path.relative(outDir, file),
          href,
          reason: `missing fragment #${resolved.hash} in ${path.relative(outDir, resolved.found)}`,
        });
      }
    }
  }
}

if (failures.length) {
  console.error(`Website export crawl failed: ${failures.length} issue(s) in ${htmlFiles.length} HTML file(s), ${checked} refs checked`);
  for (const f of failures.slice(0, 40)) {
    console.error(`- ${f.file}: ${f.href} — ${f.reason}`);
  }
  if (failures.length > 40) {
    console.error(`… and ${failures.length - 40} more`);
  }
  process.exit(1);
}

console.log(
  `Website export crawl ok: ${htmlFiles.length} HTML file(s), ${checked} local href/src refs`,
);
