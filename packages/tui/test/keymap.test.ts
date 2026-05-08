import { describe, expect, it } from "vitest";

import { mapInputToAction } from "../src/keymap.js";

describe("mapInputToAction", () => {
  it("maps arrow keys", () => {
    expect(mapInputToAction("", { upArrow: true })).toBe("up");
    expect(mapInputToAction("", { downArrow: true })).toBe("down");
    expect(mapInputToAction("", { leftArrow: true })).toBe("collapse");
    expect(mapInputToAction("", { rightArrow: true })).toBe("expand");
  });

  it("maps vim keys", () => {
    expect(mapInputToAction("j")).toBe("down");
    expect(mapInputToAction("k")).toBe("up");
    expect(mapInputToAction("h")).toBe("collapse");
    expect(mapInputToAction("l")).toBe("expand");
  });

  it("maps enter", () => {
    expect(mapInputToAction("", { return: true })).toBe("expand");
  });

  it("maps space", () => {
    expect(mapInputToAction(" ")).toBe("toggle");
  });

  it("maps d", () => {
    expect(mapInputToAction("d")).toBe("details");
  });

  it("maps ?", () => {
    expect(mapInputToAction("?")).toBe("help");
  });

  it("maps q", () => {
    expect(mapInputToAction("q")).toBe("quit");
    expect(mapInputToAction("Q")).toBe("quit");
  });

  it("maps ctrl+c", () => {
    expect(mapInputToAction("c", { ctrl: true })).toBe("quit");
  });

  it("maps escape", () => {
    expect(mapInputToAction("", { escape: true })).toBe("quit");
  });

  it("returns unknown for unrelated input", () => {
    expect(mapInputToAction("x")).toBe("unknown");
    expect(mapInputToAction("")).toBe("unknown");
  });
});
