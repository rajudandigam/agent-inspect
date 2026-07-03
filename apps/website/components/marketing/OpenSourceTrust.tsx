import Link from "next/link";

import { site } from "@/lib/site";

const links = [
  { href: site.github, label: "MIT license", external: true },
  { href: "/docs/concepts/local-first", label: "Local JSONL files" },
  { href: "/docs/concepts/trace-check-redact", label: "Metadata-only default" },
  { href: "/docs/safe-sharing", label: "Redaction profiles" },
  { href: "/docs/safe-sharing", label: "verify-safe before sharing" },
  { href: `${site.github}/issues`, label: "GitHub issues and discussions", external: true },
  { href: site.npm, label: "npm package", external: true },
  {
    href: `${site.github}/blob/main/docs/TECHNICAL-GUIDE.md`,
    label: "Technical guide",
    external: true,
  },
  {
    href: `${site.github}/blob/main/docs/SAFE-TRACE-SHARING.md`,
    label: "Safe trace sharing docs",
    external: true,
  },
];

export function OpenSourceTrust() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Open source trust
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Transparent defaults you can audit
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            AgentInspect is MIT-licensed, dependency-light at the root, and explicit
            about network behavior: no upload by default.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={site.npm} target="_blank" rel="noreferrer noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.badges.npmVersion} alt="npm version" height={20} />
          </a>
          <a href={site.github} target="_blank" rel="noreferrer noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.badges.githubStars} alt="GitHub stars" height={20} />
          </a>
          <a href={site.github} target="_blank" rel="noreferrer noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.badges.githubLicense} alt="MIT license" height={20} />
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-border bg-elevated px-3 py-1.5 text-sm text-muted transition hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border border-border bg-elevated px-3 py-1.5 text-sm text-muted transition hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
