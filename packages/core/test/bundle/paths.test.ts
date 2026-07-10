import { describe, expect, it } from "vitest";

import {
  assertBundlePathContained,
  bundleRunAssetRelativePath,
  sanitizeBundleRunId,
} from "../../src/bundle/paths.js";

describe("bundle path safety", () => {
  it("sanitizes traversal and unsafe characters in run ids", () => {
    expect(sanitizeBundleRunId("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeBundleRunId("run<script>")).toBe("run_script_");
    expect(sanitizeBundleRunId("")).toBe("run_unknown");
    expect(sanitizeBundleRunId("..")).toBe("run_unknown");
  });

  it("builds posix asset paths inside bundle layout", () => {
    expect(bundleRunAssetRelativePath("my-run", ".jsonl")).toBe(
      "assets/runs/my-run.jsonl",
    );
    expect(bundleRunAssetRelativePath("../evil", ".html")).toBe(
      "assets/runs/evil.html",
    );
  });

  it("rejects paths that escape the bundle directory", () => {
    const output = "/tmp/bundle-out";
    expect(assertBundlePathContained(output, "assets/runs/a.jsonl")).toContain(
      "bundle-out",
    );
    expect(() => assertBundlePathContained(output, "../outside.txt")).toThrow(
      /escapes output directory/,
    );
  });
});
