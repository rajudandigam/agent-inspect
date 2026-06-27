import { describe, expect, it } from "vitest";

import {
  createInspector,
  getCurrentCorrelationMetadata,
  inspectRun,
  maybeInspectRun,
  observe,
  step,
} from "../src/index.js";
import {
  isAgentInspectEnabled,
} from "../src/entries/advanced.js";
import {
  parseLogsToTrees,
  renderRunTrees,
  JsonLogParser,
  Log4jsParser,
  Redactor,
  TreeBuilder,
  parseLogLine,
  LiveLogAccumulator,
} from "../src/entries/logs.js";

describe("package exports", () => {
  it("exposes the v2 stable root APIs from the barrel", () => {
    expect(typeof createInspector).toBe("function");
    expect(typeof inspectRun).toBe("function");
    expect(typeof maybeInspectRun).toBe("function");
    expect(typeof getCurrentCorrelationMetadata).toBe("function");
    expect(typeof step).toBe("function");
    expect(typeof step.llm).toBe("function");
    expect(typeof step.tool).toBe("function");
    expect(typeof observe).toBe("function");
  });

  it("exposes enablement helper from the advanced subpath", () => {
    expect(typeof isAgentInspectEnabled).toBe("function");
  });

  it("exposes v0.3 log-to-tree APIs from the logs subpath", () => {
    expect(typeof parseLogsToTrees).toBe("function");
    expect(typeof renderRunTrees).toBe("function");
    expect(typeof JsonLogParser).toBe("function");
    expect(typeof Log4jsParser).toBe("function");
    expect(typeof Redactor).toBe("function");
    expect(typeof TreeBuilder).toBe("function");
  });

  it("exposes v0.4 incremental tail APIs from the logs subpath", () => {
    expect(typeof parseLogLine).toBe("function");
    expect(typeof LiveLogAccumulator).toBe("function");
  });
});
