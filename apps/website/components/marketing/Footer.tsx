import Link from "next/link";

import { site } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/docs/getting-started", label: "Getting started" },
      { href: "/docs/concepts/local-first", label: "Local-first" },
      { href: "/docs/safe-sharing", label: "Safe sharing" },
      { href: "/docs/ci", label: "CI artifacts" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { href: "/docs/integrations/ai-sdk", label: "AI SDK" },
      { href: "/docs/integrations/openai-agents", label: "OpenAI Agents" },
      { href: "/docs/integrations/langchain", label: "LangChain" },
      { href: "/docs/cli", label: "CLI" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: site.github, label: "GitHub", external: true },
      { href: site.npm, label: "npm", external: true },
      { href: "/docs/contributing", label: "Contributing" },
      { href: "/docs/compare", label: "Compare" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div>
          <p className="text-lg font-semibold">{site.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Local-first trace + check + redact for TypeScript AI agents.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-ink"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="hover:text-ink">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-border px-4 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>MIT license. No account. No upload by default.</p>
        <p>Not a hosted SaaS product or production APM.</p>
      </div>
    </footer>
  );
}
