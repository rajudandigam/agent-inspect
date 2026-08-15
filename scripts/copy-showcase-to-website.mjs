#!/usr/bin/env node
/**
 * Copy canonical showcase media into the website public/ directory at build time.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "docs/assets/showcase");
const dest = path.join(root, "apps/website/public/showcase");
if (!existsSync(src)) {
  console.error("[copy-showcase] missing docs/assets/showcase");
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-showcase] apps/website/public/showcase");
