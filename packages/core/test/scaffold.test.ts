import { describe, expect, it } from "vitest";

import { scaffoldPing } from "../src/index.js";

describe("@agent-inspect/core scaffold", () => {
  it("returns a prefixed token", () => {
    const out = scaffoldPing();
    expect(out).toMatch(/^agent-inspect:[\w-]+$/);
  });
});
