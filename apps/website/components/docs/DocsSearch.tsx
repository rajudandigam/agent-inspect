"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { docHref, docPages } from "@/lib/docs";

export function DocsSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return docPages
      .filter(
        (page) =>
          page.title.toLowerCase().includes(normalized) ||
          page.description.toLowerCase().includes(normalized) ||
          page.section.toLowerCase().includes(normalized),
      )
      .slice(0, 6);
  }, [query]);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="docs-search">
        Search docs
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2">
        <Search className="h-4 w-4 text-muted" aria-hidden />
        <input
          id="docs-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          autoComplete="off"
        />
      </div>
      {query.trim() ? (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-surface p-2 shadow-lg">
          {results.length ? (
            <ul className="space-y-1">
              {results.map((page) => (
                <li key={page.slug || "home"}>
                  <Link
                    href={docHref(page.slug)}
                    className="block rounded-lg px-3 py-2 hover:bg-elevated"
                    onClick={() => setQuery("")}
                  >
                    <p className="text-sm font-medium text-ink">{page.title}</p>
                    <p className="text-xs text-muted">{page.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-muted">No matching pages.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
