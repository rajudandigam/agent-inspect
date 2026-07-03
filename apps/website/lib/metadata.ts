import type { Metadata } from "next";

import { site } from "./site";

export function createMetadata(overrides?: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const title = overrides?.title ?? site.title;
  const description = overrides?.description ?? site.description;
  const path = overrides?.path ?? "/";
  const url = `${site.url}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    keywords: [...site.keywords],
    authors: [{ name: "AgentInspect contributors" }],
    metadataBase: new URL(site.url),
    icons: {
      icon: "/favicon.svg",
    },
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: site.name,
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          alt: "agent-inspect — local-first AI agent tracing",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.svg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "agent-inspect",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Node.js",
  license: "https://opensource.org/licenses/MIT",
  description: site.description,
  url: site.url,
  downloadUrl: site.npm,
  codeRepository: site.github,
  programmingLanguage: "TypeScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
