import Link from "next/link";

import type { DocPage } from "@/lib/docs";

type DocsBreadcrumbsProps = {
  page: DocPage;
};

export function DocsBreadcrumbs({ page }: DocsBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/docs" className="hover:text-ink">
            Docs
          </Link>
        </li>
        {page.slug ? (
          <>
            <li aria-hidden>/</li>
            <li>
              <span className="text-muted">{page.section}</span>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink">{page.title}</li>
          </>
        ) : (
          <>
            <li aria-hidden>/</li>
            <li className="text-ink">Overview</li>
          </>
        )}
      </ol>
    </nav>
  );
}
