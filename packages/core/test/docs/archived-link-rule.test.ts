import { describe, expect, it } from "vitest";

// Pure rule module shared with scripts/validate-doc-links.mjs; imported via a
// computed specifier because the scripts tree is not part of the TS project.
const rulePath = new URL(
  "../../../../scripts/lib/archived-link-rule.mjs",
  import.meta.url,
).href;

type Violation = { source: string; href: string; target: string };
type RuleModule = {
  findArchivedLinkViolations: (
    entries: Array<{ source: string; text: string }>,
  ) => Violation[];
  ALLOWED_HISTORICAL_LINKS: Array<{ source: string; targetPrefix: string }>;
};

async function loadRule(): Promise<RuleModule> {
  return (await import(rulePath)) as RuleModule;
}

describe("archived-link rule", () => {
  it("fails on a synthetic archived link from an active doc", async () => {
    const { findArchivedLinkViolations } = await loadRule();
    const violations = findArchivedLinkViolations([
      {
        source: "docs/GUIDE.md",
        text: "See the [old roadmap](./archive/implementation/OLD.md) for details.",
      },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      source: "docs/GUIDE.md",
      target: "docs/archive/implementation/OLD.md",
    });
  });

  it("resolves relative traversal from nested sources", async () => {
    const { findArchivedLinkViolations } = await loadRule();
    const violations = findArchivedLinkViolations([
      {
        source: "docs/community/DEEP.md",
        text: "[drafts](../../.github/ISSUE_DRAFTS/001.md)",
      },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.target).toBe(".github/ISSUE_DRAFTS/001.md");
  });

  it("passes allowlisted historical citations", async () => {
    const { findArchivedLinkViolations } = await loadRule();
    const violations = findArchivedLinkViolations([
      {
        source: "GOOD-FIRST-ISSUES.md",
        text: "Historical issue drafts: [archive](docs/archive/github/)",
      },
      {
        source: "docs/HARNESS.md",
        text: "Full historical doc: [archived](./archive/public/HARNESS.md)",
      },
    ]);

    expect(violations).toEqual([]);
  });

  it("does not allowlist the same target from other sources", async () => {
    const { findArchivedLinkViolations } = await loadRule();
    const violations = findArchivedLinkViolations([
      {
        source: "docs/GETTING-STARTED.md",
        text: "[archived harness](./archive/public/HARNESS.md)",
      },
    ]);

    expect(violations).toHaveLength(1);
  });

  it("ignores external, anchor, and normal relative links", async () => {
    const { findArchivedLinkViolations } = await loadRule();
    const violations = findArchivedLinkViolations([
      {
        source: "docs/GUIDE.md",
        text: [
          "[site](https://example.test/docs/archive/x)",
          "[mail](mailto:person@example.test)",
          "[anchor](#archive)",
          "[sibling](./API.md)",
          "[fragment of archived](./API.md#docs-archive)",
        ].join("\n"),
      },
    ]);

    expect(violations).toEqual([]);
  });
});
