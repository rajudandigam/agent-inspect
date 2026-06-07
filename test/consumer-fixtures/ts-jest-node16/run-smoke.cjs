const { spawnSync } = require("node:child_process");
const path = require("node:path");

const tscBin =
  process.env.AGENT_INSPECT_TSC_BIN ||
  path.join(process.cwd(), "node_modules", "typescript", "bin", "tsc");

const compile = spawnSync(process.execPath, [tscBin, "-p", "tsconfig.json"], {
  cwd: __dirname,
  encoding: "utf8",
});
if (compile.status !== 0) {
  console.error(compile.stdout || compile.stderr);
  process.exit(compile.status ?? 1);
}

const { smoke } = require("./dist/smoke.cjs");
smoke()
  .then((value) => {
    if (value !== 1) process.exit(1);
    console.log("ts-jest-node16:ok");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
