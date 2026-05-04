import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const coreMjs = path.join(here, "../../dist/index.mjs");
const coreCjs = path.join(here, "../../dist/index.cjs");
const cliCjs = path.join(here, "../../../packages/cli/dist/index.cjs");

const distPresent = existsSync(coreMjs);

describe("package dist smoke", () => {
  it.skipIf(!distPresent)(
    "built core and CLI artifacts exist after pnpm build",
    () => {
      expect(existsSync(coreMjs)).toBe(true);
      expect(existsSync(coreCjs)).toBe(true);
      expect(existsSync(cliCjs)).toBe(true);
    },
  );
});
