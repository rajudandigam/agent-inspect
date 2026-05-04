import { afterEach, describe, expect, it, vi } from "vitest";

import { runWithContext } from "../src/context.js";
import {
  formatTerminalName,
  getIndent,
  printError,
  printFailedAt,
  printRunComplete,
  printRunStart,
  printStepComplete,
  printStepStart,
  renderErrorLine,
  renderRunSummary,
  renderStepLine,
  MAX_TERMINAL_DEPTH,
  TERMINAL_INDENT,
} from "../src/terminal.js";

describe("renderStepLine", () => {
  it("success step includes check icon, name, and duration", () => {
    const line = renderStepLine("tool:search", 900, "success", 0);
    expect(line).toContain("✔");
    expect(line).toContain("tool:search");
    expect(line).toContain("900ms");
  });

  it("error step includes cross icon", () => {
    const line = renderStepLine("x", 100, "error", 0);
    expect(line).toContain("✖");
    expect(line).toContain("100ms");
  });

  it("running without duration shows hourglass only", () => {
    const line = renderStepLine("llm:gpt-4.1", undefined, "running", 0);
    expect(line).toContain("⏳");
    expect(line).toContain("llm:gpt-4.1");
    expect(line).not.toContain("(");
  });

  it("depth 1 adds one indent unit", () => {
    const line = renderStepLine("a", 1, "success", 1);
    expect(line.startsWith(TERMINAL_INDENT)).toBe(true);
  });

  it("depth 2 adds two indent units", () => {
    const line = renderStepLine("a", 1, "success", 2);
    expect(line.startsWith(TERMINAL_INDENT.repeat(2))).toBe(true);
  });

  it("negative depth behaves like 0", () => {
    expect(getIndent(-3)).toBe(getIndent(0));
  });

  it("caps depth at MAX_TERMINAL_DEPTH", () => {
    expect(getIndent(999).length).toBe(
      TERMINAL_INDENT.length * MAX_TERMINAL_DEPTH,
    );
  });

  it("truncates long names", () => {
    const long = "n".repeat(120);
    const line = renderStepLine(long, 1, "success", 0);
    expect(line).toContain("...");
  });

  it("empty name becomes unnamed", () => {
    expect(renderStepLine("", 1, "success", 0)).toContain("unnamed");
  });
});

describe("renderErrorLine", () => {
  it("includes Error prefix and message", () => {
    const line = renderErrorLine({ message: "Timeout after 5000ms" }, 0);
    expect(line).toContain("Error:");
    expect(line).toContain("Timeout after 5000ms");
  });

  it("indents relative to depth", () => {
    const line = renderErrorLine({ message: "e" }, 1);
    expect(line.startsWith(TERMINAL_INDENT.repeat(2))).toBe(true);
  });

  it("handles empty message", () => {
    const line = renderErrorLine({ message: "" }, 0);
    expect(line).toContain("Error:");
  });
});

describe("renderRunSummary", () => {
  it("success summary", () => {
    const lines = renderRunSummary(2700, "success");
    expect(lines[0]).toMatch(/^Completed in /);
    expect(lines.length).toBe(1);
  });

  it("error summary", () => {
    const lines = renderRunSummary(5200, "error");
    expect(lines[0]).toMatch(/^Failed in /);
  });

  it("includes trace line when path provided", () => {
    const lines = renderRunSummary(100, "success", "/path/run.jsonl");
    expect(lines).toContain("Trace: /path/run.jsonl");
  });

  it("omits trace when path undefined", () => {
    const lines = renderRunSummary(100, "success", undefined);
    expect(lines.some((l) => l.startsWith("Trace:"))).toBe(false);
  });
});

describe("printRunStart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs AgentInspect header with name and runId", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      {
        runId: "run_a",
        runName: "r",
        traceDir: "/t",
        silent: false,
      },
      async () => {
        printRunStart("run_a", "trip-planner");
      },
    );
    const joined = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("AgentInspect");
    expect(joined).toContain("trip-planner");
    expect(joined).toContain("run_a");
  });

  it("no console output when silent", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      {
        runId: "run_a",
        runName: "r",
        traceDir: "/t",
        silent: true,
      },
      async () => {
        printRunStart("run_a", "trip-planner");
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("printStepStart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints running line with depth", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      {
        runId: "r",
        runName: "n",
        traceDir: "/t",
        silent: false,
      },
      async () => {
        printStepStart("child", 1);
      },
    );
    const out = String(spy.mock.calls[0]?.[0]);
    expect(out).toContain("⏳");
    expect(out).toContain("child");
    expect(out.startsWith(TERMINAL_INDENT)).toBe(true);
  });

  it("silent no-op", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: true },
      async () => {
        printStepStart("x", 0);
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("printStepComplete", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints success and error", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printStepComplete("ok", 10, "success", 0);
        printStepComplete("bad", 20, "error", 1);
      },
    );
    const a = String(spy.mock.calls[0]?.[0]);
    const b = String(spy.mock.calls[1]?.[0]);
    expect(a).toContain("✔");
    expect(b).toContain("✖");
  });

  it("silent no-op", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: true },
      async () => {
        printStepComplete("x", 1, "success", 0);
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("printError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints error without stack", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printError({ message: "m", stack: "hidden" }, 0);
      },
    );
    const out = String(spy.mock.calls[0]?.[0]);
    expect(out).toContain("Error: m");
    expect(out).not.toContain("hidden");
  });

  it("silent no-op", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: true },
      async () => {
        printError({ message: "x" }, 0);
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("printRunComplete", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints success summary and trace", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printRunComplete("n", "r", 2700, "success", "~/.agent-inspect/runs/run_x.jsonl");
      },
    );
    const text = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(text).toContain("Completed in");
    expect(text).toContain("Trace:");
  });

  it("prints failed summary", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printRunComplete("n", "r", 5200, "error");
      },
    );
    expect(String(spy.mock.calls[0]?.[0])).toContain("Failed in");
  });

  it("silent no-op", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: true },
      async () => {
        printRunComplete("n", "r", 1, "success", "/p");
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("printFailedAt", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints failed step label", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printFailedAt("tool:pricingAPI");
      },
    );
    expect(String(spy.mock.calls[0]?.[0])).toContain("Failed at:");
    expect(String(spy.mock.calls[0]?.[0])).toContain("tool:pricingAPI");
  });

  it("truncates long step name", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const long = "t".repeat(120);
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        printFailedAt(long);
      },
    );
    expect(String(spy.mock.calls[0]?.[0])).toContain("...");
  });

  it("silent no-op", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: true },
      async () => {
        printFailedAt("x");
      },
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("formatTerminalName and getIndent", () => {
  it("formatTerminalName delegates to truncate rules", () => {
    expect(formatTerminalName("")).toBe("unnamed");
    expect(formatTerminalName("   ")).toBe("unnamed");
  });

  it("getIndent caps depth", () => {
    expect(getIndent(0)).toBe("");
    expect(getIndent(1)).toBe(TERMINAL_INDENT);
    expect(getIndent(MAX_TERMINAL_DEPTH + 5).length).toBe(
      TERMINAL_INDENT.length * MAX_TERMINAL_DEPTH,
    );
  });
});

describe("safe print behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("printStepComplete does not throw when console.log throws", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("log boom");
    });
    await runWithContext(
      { runId: "r", runName: "n", traceDir: "/t", silent: false },
      async () => {
        expect(() => printStepComplete("x", 1, "success", 0)).not.toThrow();
      },
    );
  });
});
