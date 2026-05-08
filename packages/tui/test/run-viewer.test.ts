import { describe, expect, it } from "vitest";

import { runTraceViewer } from "../src/run-viewer.js";

describe("runTraceViewer", () => {
  it("throws when stdout is not a TTY", async () => {
    const prevOut = process.stdout.isTTY;
    const prevIn = process.stdin.isTTY;
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
    await expect(runTraceViewer({ runId: "x" })).rejects.toThrow(/interactive terminal/);
    Object.defineProperty(process.stdout, "isTTY", { value: prevOut, configurable: true });
    Object.defineProperty(process.stdin, "isTTY", { value: prevIn, configurable: true });
  });

  it("throws when stdin is not a TTY", async () => {
    const prevOut = process.stdout.isTTY;
    const prevIn = process.stdin.isTTY;
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
    await expect(runTraceViewer({ runId: "x" })).rejects.toThrow(/interactive terminal/);
    Object.defineProperty(process.stdout, "isTTY", { value: prevOut, configurable: true });
    Object.defineProperty(process.stdin, "isTTY", { value: prevIn, configurable: true });
  });
});
