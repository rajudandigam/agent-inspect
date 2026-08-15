#!/usr/bin/env node
/**
 * Verify generated public demo Evidence assets are present and integrity-ok.
 * Usage: pnpm demo:verify
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "packages/cli/dist/index.cjs");
const evidenceRoot = path.join(root, "examples/evidence");
const manifestPath = path.join(evidenceRoot, "demo-manifest.json");

const failures = [];

function fail(msg) {
  failures.push(msg);
}

function walkSync(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walkSync(p));
    else out.push(p);
  }
  return out;
}

if (!existsSync(manifestPath)) {
  fail("missing examples/evidence/demo-manifest.json — run pnpm demo:generate");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pkgVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
    .version;
  if (manifest.packageVersion !== pkgVersion) {
    fail(
      `demo-manifest packageVersion ${manifest.packageVersion} != package.json ${pkgVersion} (regenerate)`,
    );
  }
  for (const sample of manifest.samples ?? []) {
    const dir = path.join(evidenceRoot, sample.id);
    const required = sample.files ?? [
      "source.jsonl",
      "check-trajectory.json",
      "bundle-verify.json",
      "evidence/evidence.html",
      "evidence/evidence.json",
      "README.md",
    ];
    for (const rel of required) {
      const p = path.join(dir, rel);
      if (!existsSync(p)) fail(`missing ${path.relative(root, p)}`);
    }
    if (existsSync(cli)) {
      const result = spawnSync(
        process.execPath,
        [cli, "bundle", "verify", path.join(dir, "evidence"), "--json"],
        { cwd: root, encoding: "utf8" },
      );
      if (result.status !== 0) {
        fail(`bundle verify failed for ${sample.id}`);
      } else {
        const parsed = JSON.parse(result.stdout);
        if (parsed.ok !== true) fail(`bundle verify not ok for ${sample.id}`);
      }
    }
  }
}

if (existsSync(path.join(evidenceRoot, "terminal-demo.txt"))) {
  const st = statSync(path.join(evidenceRoot, "terminal-demo.txt"));
  if (st.size > 64 * 1024) fail("terminal-demo.txt exceeds 64KB budget");
}

if (existsSync(evidenceRoot)) {
  for (const file of walkSync(evidenceRoot)) {
    if (file.toLowerCase().endsWith(".zip")) {
      fail(`committed demo ZIP not allowed: ${path.relative(root, file)}`);
    }
    const st = statSync(file);
    if (st.size > 512 * 1024) {
      fail(`demo asset exceeds 512KB: ${path.relative(root, file)} (${st.size})`);
    }
  }
}

const showcase = path.join(root, "docs/assets/showcase");
if (!existsSync(path.join(showcase, "provenance.json"))) {
  fail("missing docs/assets/showcase/provenance.json");
} else {
  const provenance = JSON.parse(readFileSync(path.join(showcase, "provenance.json"), "utf8"));
  const pkgVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
    .version;
  if (provenance.packageVersion !== pkgVersion) {
    fail(
      `showcase provenance packageVersion ${provenance.packageVersion} != ${pkgVersion}`,
    );
  }
  const required = [
    "gif/debug-tree.gif",
    "gif/check-pass-fail.gif",
    "gif/evidence-bundle.gif",
    "diagrams/value-loop.svg",
  ];
  for (const rel of required) {
    if (!existsSync(path.join(showcase, rel))) fail(`missing showcase ${rel}`);
  }
  const requiredIds = ["debug-tree", "check-pass-fail", "evidence-bundle"];
  const ids = new Set((provenance.assets ?? []).map((asset) => asset.id));
  for (const id of requiredIds) {
    if (!ids.has(id)) fail(`showcase provenance missing ${id}`);
  }
  for (const asset of provenance.assets ?? []) {
    if (!asset.caption) fail(`showcase ${asset.id} missing caption`);
    if (!asset.transcript) fail(`showcase ${asset.id} missing transcript`);
    for (const rel of Object.values(asset.files ?? {})) {
      const abs = path.join(root, rel);
      if (!existsSync(abs)) {
        fail(`provenance missing file ${rel}`);
        continue;
      }
      const st = statSync(abs);
      if (rel.endsWith(".gif") && st.size > 1024 * 1024) {
        fail(`showcase GIF exceeds 1MB: ${rel}`);
      }
      if (rel.endsWith(".png") && st.size > 512 * 1024) {
        fail(`showcase PNG exceeds 512KB: ${rel}`);
      }
    }
    const gifRel = asset.files?.gif;
    if (gifRel) {
      const gifPath = path.join(root, gifRel);
      const count = readFileSync(gifPath).toString("binary").split("\x21\xf9\x04").length - 1;
      if (count < 2) fail(`blank/one-frame showcase GIF ${gifRel}`);
    }
    for (const [kind, expected] of Object.entries(asset.sha256 ?? {})) {
      const rel = asset.files?.[kind];
      if (!rel) continue;
      const abs = path.join(root, rel);
      if (!existsSync(abs)) continue;
      const actual = createHash("sha256").update(readFileSync(abs)).digest("hex");
      if (actual !== expected) {
        fail(`showcase hash mismatch ${rel}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("[demo:verify] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log("[demo:verify] OK");
