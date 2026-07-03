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
};

export const docPages: DocPage[] = [
  {
    slug: "",
    title: "Documentation",
    description:
      "Local-first docs for tracing, checking, and redacting TypeScript AI agent runs.",
    section: "Start",
    toc: [
      { id: "start-here", title: "Start here" },
      { id: "browse", title: "Browse by topic" },
    ],
    next: "getting-started",
  },
  {
    slug: "getting-started",
    title: "Getting started",
    description:
      "Install AgentInspect, run the deterministic demo, inspect a trace, check it, and create a share-safe artifact.",
    section: "Start",
    toc: [
      { id: "install", title: "Install" },
      { id: "init", title: "Init" },
      { id: "demo", title: "Run demo" },
      { id: "inspect", title: "Inspect" },
      { id: "check", title: "Check" },
      { id: "share", title: "Redact and verify" },
      { id: "next-steps", title: "Next steps" },
    ],
    previous: "",
    next: "concepts/local-first",
  },
  {
    slug: "concepts/local-first",
    title: "Local-first",
    description:
      "Traces stay on disk by default. No account, no upload, and no hosted dashboard required.",
    section: "Concepts",
    toc: [
      { id: "what-local-first-means", title: "What local-first means" },
      { id: "jsonl-on-disk", title: "JSONL on disk" },
      { id: "where-it-fits", title: "Where it fits" },
    ],
    previous: "getting-started",
    next: "concepts/trace-check-redact",
  },
  {
    slug: "concepts/trace-check-redact",
    title: "Trace, check, redact",
    description:
      "The AgentInspect product loop: capture what happened, check expectations, and redact before sharing.",
    section: "Concepts",
    toc: [
      { id: "trace", title: "Trace" },
      { id: "check", title: "Check" },
      { id: "redact", title: "Redact" },
    ],
    previous: "concepts/local-first",
    next: "integrations",
  },
  {
    slug: "integrations",
    title: "Integrations",
    description:
      "Manual instrumentation, framework adapters, logs, harness, CI reporters, and adapter SDK paths.",
    section: "Integrations",
    toc: [{ id: "paths", title: "Integration paths" }],
    previous: "concepts/trace-check-redact",
    next: "integrations/ai-sdk",
  },
  {
    slug: "integrations/ai-sdk",
    title: "AI SDK",
    description:
      "Use @agent-inspect/ai-sdk with Vercel AI SDK telemetry. Metadata-only by default.",
    section: "Integrations",
    toc: [
      { id: "install", title: "Install" },
      { id: "example", title: "Example" },
      { id: "privacy", title: "Privacy" },
    ],
    previous: "integrations",
    next: "integrations/openai-agents",
  },
  {
    slug: "integrations/openai-agents",
    title: "OpenAI Agents",
    description:
      "Local AgentInspect processor for OpenAI Agents JS. Prefer setTraceProcessors for local-only traces.",
    section: "Integrations",
    toc: [
      { id: "local-only", title: "Local-only mode" },
      { id: "example", title: "Example" },
      { id: "privacy", title: "Privacy notes" },
    ],
    previous: "integrations/ai-sdk",
    next: "integrations/langchain",
  },
  {
    slug: "integrations/langchain",
    title: "LangChain",
    description:
      "LangChain callback handler that writes local AgentInspect JSONL traces.",
    section: "Integrations",
    toc: [
      { id: "install", title: "Install" },
      { id: "example", title: "Example" },
      { id: "privacy", title: "Privacy" },
    ],
    previous: "integrations/openai-agents",
    next: "cli",
  },
  {
    slug: "cli",
    title: "CLI",
    description:
      "High-level AgentInspect CLI command groups for local inspect, check, redact, and export workflows.",
    section: "Reference",
    toc: [
      { id: "overview", title: "Overview" },
      { id: "command-groups", title: "Command groups" },
    ],
    previous: "integrations/langchain",
    next: "safe-sharing",
  },
  {
    slug: "safe-sharing",
    title: "Safe trace sharing",
    description:
      "Redact and verify traces before attaching them to PRs, issues, or design-partner threads.",
    section: "Guides",
    toc: [
      { id: "why", title: "Why it matters" },
      { id: "workflow", title: "Workflow" },
      { id: "limits", title: "Limits" },
    ],
    previous: "cli",
    next: "ci",
  },
  {
    slug: "ci",
    title: "CI artifacts",
    description:
      "Run deterministic checks in CI and upload redacted local artifacts with your CI platform.",
    section: "Guides",
    toc: [
      { id: "pattern", title: "CI pattern" },
      { id: "checks", title: "Checks" },
      { id: "artifacts", title: "Artifacts" },
    ],
    previous: "safe-sharing",
    next: "compare",
  },
  {
    slug: "compare",
    title: "Compare",
    description:
      "How AgentInspect relates to console.log, hosted observability platforms, and OpenTelemetry.",
    section: "Guides",
    toc: [
      { id: "positioning", title: "Positioning" },
      { id: "table", title: "Comparison" },
    ],
    previous: "ci",
    next: "contributing",
  },
  {
    slug: "contributing",
    title: "Contributing",
    description:
      "Good first contribution surfaces for docs, examples, fixtures, adapters, and editor polish.",
    section: "Community",
    toc: [
      { id: "good-first", title: "Good first contributions" },
      { id: "boundaries", title: "Boundaries" },
    ],
    previous: "compare",
  },
];

export type DocsNavSection = {
  title: string;
  items: Array<{ title: string; href: string }>;
};

export const docsNav: DocsNavSection[] = [
  {
    title: "Start",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Getting started", href: "/docs/getting-started" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { title: "Local-first", href: "/docs/concepts/local-first" },
      {
        title: "Trace, check, redact",
        href: "/docs/concepts/trace-check-redact",
      },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "Overview", href: "/docs/integrations" },
      { title: "AI SDK", href: "/docs/integrations/ai-sdk" },
      { title: "OpenAI Agents", href: "/docs/integrations/openai-agents" },
      { title: "LangChain", href: "/docs/integrations/langchain" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "CLI", href: "/docs/cli" },
      { title: "Safe sharing", href: "/docs/safe-sharing" },
      { title: "CI artifacts", href: "/docs/ci" },
      { title: "Compare", href: "/docs/compare" },
    ],
  },
  {
    title: "Community",
    items: [{ title: "Contributing", href: "/docs/contributing" }],
  },
];

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function getDocPage(slugParts: string[] | undefined): DocPage | undefined {
  const slug = (slugParts ?? []).join("/");
  return docPages.find((page) => page.slug === slug);
}

export function getAllDocSlugs(): string[][] {
  return docPages.map((page) => (page.slug ? page.slug.split("/") : []));
}
