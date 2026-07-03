import type { ReactNode } from "react";

import type { DocPage } from "@/lib/docs";
import { site } from "@/lib/site";

import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";

import { DocsBreadcrumbs } from "./DocsBreadcrumbs";
import { DocsMobileNav } from "./DocsMobileNav";
import { DocsPager } from "./DocsPager";
import { DocsSearch } from "./DocsSearch";
import { DocsSidebar } from "./DocsSidebar";
import { DocsToc } from "./DocsToc";

type DocsLayoutProps = {
  page: DocPage;
  currentPath: string;
  children: ReactNode;
};

export function DocsLayout({ page, currentPath, children }: DocsLayoutProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_180px]">
        <DocsSidebar currentPath={currentPath} />
        <div className="min-w-0">
          <div className="mb-6">
            <DocsSearch />
          </div>
          <DocsMobileNav currentPath={currentPath} />
          <DocsBreadcrumbs page={page} />
          <article className="prose-docs">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {page.title}
            </h1>
            <p className="mt-3 text-lg leading-8 text-muted">{page.description}</p>
            {children}
          </article>
          <DocsPager previous={page.previous} next={page.next} />
          <p className="mt-8 text-sm text-muted">
            Full reference remains in{" "}
            <a
              href={site.githubDocs}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-primary hover:underline"
            >
              GitHub docs
            </a>{" "}
            during the docs migration.
          </p>
        </div>
        <DocsToc items={page.toc} />
      </div>
      <Footer />
    </div>
  );
}
