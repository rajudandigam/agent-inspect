import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { docHref, docPages } from "@/lib/docs";

type DocsPagerProps = {
  previous?: string;
  next?: string;
};

function resolve(slug?: string) {
  if (slug === undefined) return undefined;
  return docPages.find((page) => page.slug === slug);
}

export function DocsPager({ previous, next }: DocsPagerProps) {
  const prevPage = resolve(previous);
  const nextPage = resolve(next);

  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav
      aria-label="Docs pagination"
      className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {prevPage ? (
        <Link
          href={docHref(prevPage.slug)}
          className="rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/40"
        >
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Previous
          </p>
          <p className="mt-2 font-semibold text-ink">{prevPage.title}</p>
        </Link>
      ) : (
        <div />
      )}
      {nextPage ? (
        <Link
          href={docHref(nextPage.slug)}
          className="rounded-2xl border border-border bg-surface p-4 text-right transition hover:border-primary/40"
        >
          <p className="flex items-center justify-end gap-2 text-xs uppercase tracking-wide text-muted">
            Next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </p>
          <p className="mt-2 font-semibold text-ink">{nextPage.title}</p>
        </Link>
      ) : null}
    </nav>
  );
}
