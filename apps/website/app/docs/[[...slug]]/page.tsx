import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocsLayout } from "@/components/docs/DocsLayout";
import { renderDocContent } from "@/lib/doc-content";
import { docHref, getAllDocSlugs, getDocPage } from "@/lib/docs";
import { createMetadata } from "@/lib/metadata";

type DocsPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) {
    return createMetadata({
      title: "Docs not found · agent-inspect",
      path: "/docs",
    });
  }

  return createMetadata({
    title: `${page.title} · agent-inspect docs`,
    description: page.description,
    path: docHref(page.slug),
  });
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) {
    notFound();
  }

  const currentPath = docHref(page.slug);

  return (
    <DocsLayout page={page} currentPath={currentPath}>
      {renderDocContent(page.slug)}
    </DocsLayout>
  );
}
