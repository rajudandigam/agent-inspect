import { Github, Menu, Package } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { site } from "@/lib/site";

const nav = [
  { href: "/#five-minute-path", label: "Quickstart" },
  { href: "/#features", label: "Features" },
  { href: "/#compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Package className="h-4 w-4" aria-hidden />
          </span>
          <span>{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-elevated px-3 text-sm font-medium text-ink transition hover:border-primary/40"
          >
            <Github className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <details className="relative md:hidden">
            <summary className="flex h-9 w-9 list-none items-center justify-center rounded-lg border border-border bg-elevated text-muted marker:content-none">
              <Menu className="h-4 w-4" aria-hidden />
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-elevated"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
