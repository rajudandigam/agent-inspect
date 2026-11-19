#!/usr/bin/env node
/**
 * Root prepack: build the monorepo unless a release-artifact pack already
 * built once (AGENT_INSPECT_SKIP_PREPACK_BUILD=1). Scoped packages have no
 * prepack; they must be packed only after that single build.
 */
import { spawnSync } from "node:child_process";

if (process.env.AGENT_INSPECT_SKIP_PREPACK_BUILD === "1") {
  process.exit(0);
}

const result = spawnSync("pnpm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
