import {
  docsManifest,
  getManifestEntry,
  manifestSlugKey,
} from "@/content/docs-manifest";

export type DocTocItem = {
  id: string;
  title: string;
};

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  section: string;
  toc?: DocTocItem[];
  previous?: string;
  next?: string;
  /** Repo-relative Markdown source from the docs manifest. */
  source?: string;
};

/**
 * Static nav/search titles and descriptions for client-safe imports.
 * Body content and TOC come from Markdown via load-doc at build time.
 */
const PAGE_META: Record<string, { title: string; description: string }> = {
  "": {
    title: "Documentation",
    description:
      "Local-first docs for tracing, checking, and redacting TypeScript AI agent runs.",
  },
  "getting-started": {
    title: "Getting started",
    description:
      "Install AgentInspect, run the deterministic demo, inspect a trace, check it, and create share-checked Evidence v2.",
  },
  "concepts/local-first": {
    title: "Local-first",
    description:
      "Traces stay on disk by default. No account, no upload, and no hosted dashboard required.",
  },
  "concepts/evidence-loop": {
    title: "Evidence loop",
    description:
      "Capture or import → understand → enforce → verify/bundle → review locally or in Studio.",
  },
  "concepts/trace-check-redact": {
    title: "Trace, check, redact",
    description:
      "The AgentInspect product loop: capture what happened, check expectations, and redact before sharing.",
  },
  contracts: {
    title: "Trace contracts (alias)",
    description: "Alias of Trace contracts. Canonical URL: /docs/trace-contracts.",
  },
  "trace-facts": {
    title: "TraceFacts",
    description: "Experimental TraceFacts / logical projection for deterministic checks.",
  },
  "trace-contracts": {
    title: "Trace contracts",
    description: "Typed TraceContract expectations (Beta) and experimental matchers.",
  },
  "test-matchers": {
    title: "Test matchers",
    description: "Experimental Vitest/Jest TraceContract matchers (canonical details on Trace contracts).",
  },
  "suites-and-gates": {
    title: "Suites and gates",
    description: "Suites, cohorts, and CI gates over local traces (Beta).",
  },
  "evidence-v2": {
    title: "Evidence v2",
    description: "Offline integrity-verifiable Evidence packages for CI and handoff.",
  },
  "coding-agent-loop": {
    title: "Coding-agent loop",
    description: "Read-only local MCP over TraceFacts (Preview).",
  },
  "no-egress": {
    title: "No-egress policy",
    description: "AgentInspect-surface no-default-network policy.",
  },
  "decision-guide": {
    title: "Decision guide",
    description: "Choose capture, contracts, Evidence, and MCP paths.",
  },
  integrations: {
    title: "Integrations",
    description:
      "Manual instrumentation, framework adapters, logs, harness, CI reporters, and adapter SDK paths.",
  },
  "integrations/ai-sdk": {
    title: "AI SDK",
    description:
      "Use @agent-inspect/ai-sdk with Vercel AI SDK telemetry. Metadata-only by default.",
  },
  "integrations/openai-agents": {
    title: "OpenAI Agents",
    description:
      "Local AgentInspect processor for OpenAI Agents JS. Prefer setTraceProcessors for local-only traces.",
  },
  "integrations/langchain": {
    title: "LangChain",
    description:
      "LangChain callback handler that writes local AgentInspect JSONL traces.",
  },
  "integrations/langgraph": {
    title: "LangGraph",
    description: "LangGraph onboarding with init --framework langgraph and Evidence gates.",
  },
  workspace: {
    title: "Workspace",
    description: "Local workspaces, optional SQLite index, sessions, and bundles.",
  },
  studio: {
    title: "Studio Beta",
    description:
      "Customer-owned Studio analyzer. Localhost by default. Ingest disabled by default.",
  },
  mcp: {
    title: "MCP",
    description: "MCP client tracing and read-only MCP server (Preview).",
  },
  standards: {
    title: "Standards",
    description: "OpenInference-compatible and OTLP GenAI-aligned bridge.",
  },
  cli: {
    title: "CLI",
    description:
      "High-level AgentInspect CLI command groups for local inspect, check, redact, and export workflows.",
  },
  "safe-sharing": {
    title: "Safe trace sharing",
    description:
      "Redact and verify traces before attaching them to PRs, issues, or design-partner threads.",
  },
  ci: {
    title: "CI artifacts",
    description:
      "Run deterministic checks in CI and upload redacted local artifacts with your CI platform.",
  },
  "support-levels": {
    title: "Support levels",
    description: "Stable, Supported, Beta, Preview, and Experimental labels.",
  },
  "network-behavior": {
    title: "Network behavior",
    description: "Explicit network surfaces and defaults.",
  },
  compare: {
    title: "Compare",
    description:
      "How AgentInspect relates to console.log, hosted observability platforms, and OpenTelemetry.",
  },
  contributing: {
    title: "Contributing",
    description:
      "Good first contribution surfaces for docs, examples, fixtures, adapters, and editor polish.",
  },
};

function buildDocPages(): DocPage[] {
  return docsManifest.map((entry, index) => {
    const slug = manifestSlugKey(entry.slug);
    const meta = PAGE_META[slug] ?? {
      title: slug || "Documentation",
      description: "",
    };
    const previous =
      index > 0 ? manifestSlugKey(docsManifest[index - 1]!.slug) : undefined;
    const next =
      index < docsManifest.length - 1
        ? manifestSlugKey(docsManifest[index + 1]!.slug)
        : undefined;

    return {
      slug,
      title: meta.title,
      description: meta.description,
      section: entry.section,
      source: entry.source,
      previous,
      next,
    };
  });
}

export const docPages: DocPage[] = buildDocPages();

export type DocsNavSection = {
  title: string;
  items: Array<{ title: string; href: string }>;
};

/** Nav sections mirror the previous docs sidebar grouping. */
const NAV_SECTION_ORDER = [
  "Start",
  "Concepts",
  "Prevent regressions",
  "Evidence and MCP",
  "Integrations",
  "Workspace and Studio",
  "MCP and standards",
  "Guides",
  "Reference",
  "Community",
] as const;

/** Slugs omitted from the sidebar (aliases stay routable). */
const NAV_HIDDEN_SLUGS = new Set(["contracts"]);

function navLabel(page: DocPage): string {
  if (page.slug === "") return "Overview";
  if (page.slug === "integrations") return "Overview";
  if (page.slug === "safe-sharing") return "Safe sharing";
  if (page.slug === "ci") return "CI artifacts";
  if (page.slug === "no-egress") return "No-egress";
  return page.title;
}

function buildDocsNav(): DocsNavSection[] {
  const bySection = new Map<string, DocPage[]>();
  for (const page of docPages) {
    if (NAV_HIDDEN_SLUGS.has(page.slug)) continue;
    const list = bySection.get(page.section) ?? [];
    list.push(page);
    bySection.set(page.section, list);
  }

  /** Prior sidebar listed CLI + reference pages under Guides. */
  const GUIDES_NAV_SLUGS = [
    "cli",
    "safe-sharing",
    "ci",
    "support-levels",
    "network-behavior",
    "compare",
  ] as const;

  const pageBySlug = new Map(docPages.map((page) => [page.slug, page]));

  const sections: DocsNavSection[] = [];
  for (const title of NAV_SECTION_ORDER) {
    if (title === "Guides") {
      sections.push({
        title: "Guides",
        items: GUIDES_NAV_SLUGS.flatMap((slug) => {
          const page = pageBySlug.get(slug);
          return page
            ? [{ title: navLabel(page), href: docHref(page.slug) }]
            : [];
        }),
      });
      continue;
    }
    if (title === "Reference") {
      // Shown under Guides to match the prior docs sidebar.
      continue;
    }
    const pages = bySection.get(title);
    if (!pages?.length) continue;
    sections.push({
      title,
      items: pages.map((page) => ({
        title: navLabel(page),
        href: docHref(page.slug),
      })),
    });
  }

  return sections;
}

export const docsNav: DocsNavSection[] = buildDocsNav();

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function getDocPage(slugParts: string[] | undefined): DocPage | undefined {
  const slug = (slugParts ?? []).join("/");
  return docPages.find((page) => page.slug === slug);
}

export function getAllDocSlugs(): string[][] {
  return docsManifest.map((entry) => [...entry.slug]);
}

export function getDocSource(slugParts: string[] | undefined): string | undefined {
  return getManifestEntry(slugParts)?.source;
}
