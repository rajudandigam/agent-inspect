import { describe, expect, it } from "vitest";

import {
  inspectRun,
  step,
  observe,
  parseLogsToTrees,
  renderRunTrees,
  JsonLogParser,
  Log4jsParser,
  Redactor,
  TreeBuilder,
  parseLogLine,
  LiveLogAccumulator,
} from "../src/index.js";

describe("package exports", () => {
  it("exposes inspectRun, step, and observe from the barrel", () => {
    expect(typeof inspectRun).toBe("function");
    expect(typeof step).toBe("function");
    expect(typeof step.llm).toBe("function");
    expect(typeof step.tool).toBe("function");
    expect(typeof observe).toBe("function");
  });

  it("exposes v0.3 log-to-tree APIs from the barrel", () => {
    expect(typeof parseLogsToTrees).toBe("function");
    expect(typeof renderRunTrees).toBe("function");
    expect(typeof JsonLogParser).toBe("function");
    expect(typeof Log4jsParser).toBe("function");
    expect(typeof Redactor).toBe("function");
    expect(typeof TreeBuilder).toBe("function");
  });

  it("exposes v0.4 incremental tail APIs from the barrel", () => {
    expect(typeof parseLogLine).toBe("function");
    expect(typeof LiveLogAccumulator).toBe("function");
  });
});
