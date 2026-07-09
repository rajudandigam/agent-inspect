import { describe, expect, it } from "vitest";

import { parseStudioRegistry } from "../src/registry.js";

describe("studio registry", () => {
  it("accepts a valid registry", () => {
    const result = parseStudioRegistry({
      schemaVersion: "1.0",
      name: "team",
      projects: [{ id: "a", path: "./demo" }],
    });
    expect(result.ok).toBe(true);
    expect(result.registry?.projects[0]?.id).toBe("a");
  });

  it("rejects invalid schema versions", () => {
    const result = parseStudioRegistry({
      schemaVersion: "9.9",
      name: "team",
      projects: [{ id: "a", path: "./demo" }],
    });
    expect(result.ok).toBe(false);
  });
});
