/**
 * Archived-link rule: active public docs must not link into archived or
 * internal-only guidance. Pure module so the doc-link checker and unit tests
 * share one implementation.
 */
import path from "node:path";

/** Repo-relative prefixes active public docs must not link into. */
export const DISALLOWED_LINK_PREFIXES = [
  "docs/archive/",
  ".github/ISSUE_DRAFTS/",
  "docs-local/",
];

/**
 * Explicitly sanctioned historical citations: sources that intentionally
 * catalog archived material and say so in their surrounding prose.
 */
export const ALLOWED_HISTORICAL_LINKS = [
  // Contributor indexes label these pointers as historical drafts.
  { source: "GOOD-FIRST-ISSUES.md", targetPrefix: "docs/archive/github/" },
  { source: "GOOD-FIRST-ISSUES.md", targetPrefix: ".github/ISSUE_DRAFTS/" },
  { source: "ROADMAP.md", targetPrefix: "docs/archive/implementation/" },
  { source: "docs/community/CONTRIBUTOR-ROLES.md", targetPrefix: "docs/archive/github/" },
  { source: "docs/community/GOOD-FIRST-ISSUES.md", targetPrefix: "docs/archive/github/" },
  // Stub docs that explicitly say "(archived)" and redirect to the full
  // historical version.
  { source: "docs/COMMUNITY-EXTENSION-REGISTRY.md", targetPrefix: "docs/archive/public/" },
  { source: "docs/HARNESS.md", targetPrefix: "docs/archive/public/" },
  { source: "docs/IDE-SURFACES.md", targetPrefix: "docs/archive/public/" },
  // The docs index links the archive index as its labeled historical section.
  { source: "docs/README.md", targetPrefix: "docs/archive/README.md" },
];

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function normalizeRepoRelative(sourceRel, href) {
  const target = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRel.replaceAll("\\", "/")), href),
  );
  return target.replaceAll("\\", "/");
}

/**
 * Find links from active public docs into disallowed prefixes.
 * @param {Array<{ source: string, text: string }>} entries repo-relative
 *   markdown sources with their content
 * @returns {Array<{ source: string, href: string, target: string }>}
 */
export function findArchivedLinkViolations(entries) {
  const violations = [];
  for (const { source, text } of entries) {
    const sourceRel = source.replaceAll("\\", "/");
    LINK_RE.lastIndex = 0;
    let match;
    while ((match = LINK_RE.exec(text))) {
      const href = match[2].split("#")[0].split("?")[0].trim();
      if (!href || /^[a-z]+:/i.test(href) || href.startsWith("/")) continue;
      const target = normalizeRepoRelative(sourceRel, href);
      const disallowed = DISALLOWED_LINK_PREFIXES.find((prefix) =>
        target.startsWith(prefix),
      );
      if (!disallowed) continue;
      const allowlisted = ALLOWED_HISTORICAL_LINKS.some(
        (entry) => entry.source === sourceRel && target.startsWith(entry.targetPrefix),
      );
      if (allowlisted) continue;
      violations.push({ source: sourceRel, href, target });
    }
  }
  return violations;
}
