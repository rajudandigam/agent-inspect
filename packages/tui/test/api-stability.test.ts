import { describe, expect, it } from "vitest";

import * as tui from "../src/index.js";

describe("@agent-inspect/tui API stability (v1.0 Pass 1)", () => {
  it("exports expected public entry points", () => {
    expect(typeof tui.runTraceViewer).toBe("function");
    expect(typeof tui.loadTraceForTui).toBe("function");
    expect(typeof tui.buildTuiTraceModel).toBe("function");
    expect(typeof tui.mapInputToAction).toBe("function");
  });
});

