#!/usr/bin/env node
/**
 * Shareable -003 packet must not embed absolute host workspace paths.
 * Identity fields are out of scope for this check — stacks/paths only.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/evidence/otlp-identity-003-2026-10-29",
);

const FORBIDDEN = [/\/Users\//, /\/home\//, /C:\\Users\\/i];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function fail(msg) {
  console.error(`[otlp-identity-003-shareable] FAIL: ${msg}`);
  process.exit(1);
}

const files = walk(ROOT);
const offenders = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const re of FORBIDDEN) {
    if (re.test(text)) {
      offenders.push(path.relative(ROOT, file));
      break;
    }
  }
}
if (offenders.length > 0) {
  fail(`absolute host paths found in:\n  - ${offenders.join("\n  - ")}`);
}

const manifest = JSON.parse(readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
if (!manifest.pathSanitization?.appliedAt) {
  fail("manifest.json missing pathSanitization.appliedAt");
}
for (const entry of manifest.files ?? []) {
  const fp = path.join(ROOT, entry.path);
  const buf = readFileSync(fp);
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== entry.sha256) {
    fail(`sha256 mismatch for ${entry.path}`);
  }
  if (buf.length !== entry.bytes) {
    fail(`byte size mismatch for ${entry.path}`);
  }
}

console.log(
  `[otlp-identity-003-shareable] OK (${files.length} files; no absolute host paths; manifest hashes match)`,
);
