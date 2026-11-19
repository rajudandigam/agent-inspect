#!/usr/bin/env node
/**
 * C0P release-artifact CLI:
 *   node scripts/release-artifacts.mjs pack [--out dir]
 *   node scripts/release-artifacts.mjs validate [--dir dir] [--expect-sha SHA]
 *   node scripts/release-artifacts.mjs qualify [--dir dir] [--keep]
 *   node scripts/release-artifacts.mjs publish [--dir dir] [--dry-run]
 *   node scripts/release-artifacts.mjs pack-and-qualify [--out dir]
 *
 * Pack assumes a prior successful `pnpm build`. Single build + sequential pack
 * avoids sibling prepack races that previously shipped empty scoped tarballs.
 */
import path from "node:path";
import {
  packAllPublishable,
  validateInventory,
  qualifyConsumers,
  publishVerifiedArtifacts,
  root,
} from "./release-artifacts-lib.mjs";

function usage() {
  console.error(`Usage:
  node scripts/release-artifacts.mjs pack [--out <dir>]
  node scripts/release-artifacts.mjs validate [--dir <dir>] [--expect-sha <sha>]
  node scripts/release-artifacts.mjs qualify [--dir <dir>] [--keep]
  node scripts/release-artifacts.mjs publish [--dir <dir>] [--dry-run]
  node scripts/release-artifacts.mjs pack-and-qualify [--out <dir>] [--keep]`);
  process.exitCode = 2;
}

function flagValue(argv, name) {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function hasFlag(argv, name) {
  return argv.includes(name);
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd) return usage();

  const outDir =
    flagValue(argv, "--out") ||
    flagValue(argv, "--dir") ||
    path.join(root, "release-artifacts");

  if (cmd === "pack") {
    const { inventoryPath, inventory } = packAllPublishable({ artifactsDir: outDir });
    console.log(
      JSON.stringify(
        {
          ok: true,
          inventoryPath,
          packageCount: inventory.packageCount,
          expectedVersion: inventory.expectedVersion,
          sourceSha: inventory.sourceSha,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "validate") {
    const inventory = validateInventory(outDir, {
      expectedSourceSha: flagValue(argv, "--expect-sha"),
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          packageCount: inventory.packageCount,
          expectedVersion: inventory.expectedVersion,
          sourceSha: inventory.sourceSha,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "qualify") {
    const { results, inventory } = qualifyConsumers(outDir, {
      keep: hasFlag(argv, "--keep"),
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          qualified: results.length,
          expectedVersion: inventory.expectedVersion,
          packages: results.map((r) => r.name),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "publish") {
    const inventory = publishVerifiedArtifacts(outDir, {
      dryRun: hasFlag(argv, "--dry-run"),
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: hasFlag(argv, "--dry-run"),
          published: inventory.packages.map((p) => `${p.name}@${p.version}`),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (cmd === "pack-and-qualify") {
    const { inventoryPath, inventory } = packAllPublishable({ artifactsDir: outDir });
    const { results } = qualifyConsumers(outDir, { keep: hasFlag(argv, "--keep") });
    console.log(
      JSON.stringify(
        {
          ok: true,
          inventoryPath,
          packageCount: inventory.packageCount,
          qualified: results.length,
          sourceSha: inventory.sourceSha,
          expectedVersion: inventory.expectedVersion,
        },
        null,
        2,
      ),
    );
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exitCode = 1;
});
