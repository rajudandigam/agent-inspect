import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function readExampleSnippet(): string {
  const readme = readFileSync(path.join(packageRoot, "README.md"), "utf8");
  const example = readme.match(/## Example\s+```ts\n([\s\S]*?)\n```/);

  if (!example?.[1]) {
    throw new Error("README Example must contain a TypeScript code block");
  }

  return example[1].replace(
    'from "@agent-inspect/redact"',
    `from ${JSON.stringify(path.join(packageRoot, "src", "index.ts"))}`
  );
}

describe("@agent-inspect/redact README", () => {
  it("runs the documented example", async () => {
    const fixtureDir = mkdtempSync(
      path.join(packageRoot, "test", ".readme-example-")
    );
    const snippetPath = path.join(fixtureDir, "example.ts");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      writeFileSync(snippetPath, readExampleSnippet());
      await import(pathToFileURL(snippetPath).href);

      const output = JSON.stringify(log.mock.calls);
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("demo-token");
    } finally {
      log.mockRestore();
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });
});
