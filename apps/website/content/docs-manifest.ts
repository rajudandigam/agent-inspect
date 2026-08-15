/**
 * Ordered website docs routes → repository Markdown sources.
 * Slugs match the previous apps/website/lib/docs.ts page list.
 */
export type DocsManifestEntry = {
  /** URL segments under /docs (empty = /docs). */
  slug: string[];
  /** Repo-relative Markdown path (under docs/ or nested). */
  source: string;
  /** Sidebar / nav section title. */
  section: string;
};

export const docsManifest: DocsManifestEntry[] = [
  { slug: [], source: "docs/README.md", section: "Start" },
  {
    slug: ["getting-started"],
    source: "docs/GETTING-STARTED.md",
    section: "Start",
  },
  {
    slug: ["concepts", "local-first"],
    source: "docs/decisions/ADR-0001-local-first.md",
    section: "Concepts",
  },
  {
    slug: ["concepts", "evidence-loop"],
    source: "docs/EVIDENCE-FIRST-ACCEPTANCE.md",
    section: "Concepts",
  },
  {
    slug: ["concepts", "trace-check-redact"],
    source: "docs/GOLDEN-PATH.md",
    section: "Concepts",
  },
  {
    slug: ["contracts"],
    source: "docs/CONTRACTS.md",
    section: "Prevent regressions",
  },
  {
    slug: ["trace-facts"],
    source: "docs/TRACE-FACTS.md",
    section: "Prevent regressions",
  },
  {
    slug: ["trace-contracts"],
    source: "docs/TRACE-CONTRACTS.md",
    section: "Prevent regressions",
  },
  {
    slug: ["test-matchers"],
    source: "docs/TEST-MATCHERS.md",
    section: "Prevent regressions",
  },
  {
    slug: ["suites-and-gates"],
    source: "docs/SUITES-COHORTS-GATES.md",
    section: "Prevent regressions",
  },
  {
    slug: ["evidence-v2"],
    source: "docs/EVIDENCE-FORMAT.md",
    section: "Evidence and MCP",
  },
  {
    slug: ["coding-agent-loop"],
    source: "docs/CODING-AGENT-LOOP.md",
    section: "Evidence and MCP",
  },
  {
    slug: ["no-egress"],
    source: "docs/NO-EGRESS-POLICY.md",
    section: "Evidence and MCP",
  },
  {
    slug: ["decision-guide"],
    source: "docs/DECISION-GUIDE.md",
    section: "Start",
  },
  {
    slug: ["integrations"],
    source: "docs/ADAPTERS.md",
    section: "Integrations",
  },
  {
    slug: ["integrations", "ai-sdk"],
    source: "docs/AI-SDK-ADOPTION.md",
    section: "Integrations",
  },
  {
    slug: ["integrations", "openai-agents"],
    source: "docs/OPENAI-AGENTS-LOCAL.md",
    section: "Integrations",
  },
  {
    slug: ["integrations", "langchain"],
    source: "docs/LANGGRAPH.md",
    section: "Integrations",
  },
  {
    slug: ["integrations", "langgraph"],
    source: "docs/LANGGRAPH.md",
    section: "Integrations",
  },
  {
    slug: ["workspace"],
    source: "docs/WORKSPACE.md",
    section: "Workspace and Studio",
  },
  {
    slug: ["studio"],
    source: "docs/SELF-HOSTING.md",
    section: "Workspace and Studio",
  },
  { slug: ["mcp"], source: "docs/MCP.md", section: "MCP and standards" },
  {
    slug: ["standards"],
    source: "docs/STANDARDS.md",
    section: "MCP and standards",
  },
  { slug: ["cli"], source: "docs/CLI.md", section: "Reference" },
  {
    slug: ["safe-sharing"],
    source: "docs/SAFE-TRACE-SHARING.md",
    section: "Guides",
  },
  { slug: ["ci"], source: "docs/CI-ARTIFACTS.md", section: "Guides" },
  {
    slug: ["support-levels"],
    source: "docs/SUPPORT-LEVELS.md",
    section: "Reference",
  },
  {
    slug: ["network-behavior"],
    source: "docs/NETWORK-BEHAVIOR.md",
    section: "Reference",
  },
  { slug: ["compare"], source: "docs/COMPARE.md", section: "Guides" },
  {
    slug: ["contributing"],
    source: "docs/community/CONTRIBUTING.md",
    section: "Community",
  },
];

export function manifestSlugKey(slug: string[]): string {
  return slug.join("/");
}

export function getManifestEntry(
  slugParts: string[] | undefined,
): DocsManifestEntry | undefined {
  const key = (slugParts ?? []).join("/");
  return docsManifest.find((entry) => manifestSlugKey(entry.slug) === key);
}
