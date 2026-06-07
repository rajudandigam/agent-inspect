/**
 * Jest 29 / CJS-style smoke (no Jest runner required).
 * Mirrors: const { maybeInspectRun } = require("agent-inspect") in a .test.cjs file.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const { maybeInspectRun } = require("agent-inspect");

const traceDir = path.join(
  os.tmpdir(),
  `agent-inspect-jest-cjs-smoke-${process.pid}-${Date.now()}`,
);

(async () => {
  const result = await maybeInspectRun(
    "jest-cjs-disabled",
    async () => 42,
    { enabled: false, traceDir },
  );

  if (result !== 42) {
    process.exit(1);
  }

  if (fs.existsSync(traceDir) && fs.readdirSync(traceDir).length > 0) {
    console.error("jest-cjs: unexpected trace file written when enabled=false");
    process.exit(2);
  }

  console.log("jest-cjs:ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
