import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Stripe/Slack value detectors are duplicated across redact, pre-disk free-text
 * patterns, and verify-safe DEFAULT_SECRET_PATTERNS. Keep the shared fragments
 * identical so the next format does not land in only one surface (#520).
 */
const STRIPE_FRAGMENT = String.raw`(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}`;
const STRIPE_LOOKAROUND = String.raw`(?<![A-Za-z0-9])(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}(?![A-Za-z0-9])`;
const SLACK_FRAGMENT = String.raw`xox[abposr]-[A-Za-z0-9-]{10,}`;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("credential value detector sync (#520/#528)", () => {
  it("keeps Stripe and Slack fragments in redact, free-text, and verify-safe lists", () => {
    const files = [
      path.join(repoRoot, "packages/redact/src/index.ts"),
      path.join(repoRoot, "packages/core/src/safety/credential-value-patterns.ts"),
      path.join(repoRoot, "packages/core/src/checks/index.ts"),
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf-8");
      expect(source, file).toContain(STRIPE_FRAGMENT);
      expect(source, file).toContain(STRIPE_LOOKAROUND);
      expect(source, file).toContain(SLACK_FRAGMENT);
    }
  });
});
