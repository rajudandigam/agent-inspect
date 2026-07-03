import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/shared/Badge";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { CopyButton } from "@/components/shared/CopyButton";
import { site } from "@/lib/site";

import { TerminalDemo } from "./TerminalDemo";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_45%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <Badge tone="primary">{site.name} · Local-first trace + check + redact</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Debug TypeScript AI agents locally
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Trace what happened, check what should have happened, and redact what
            must not leave your machine. No account. No upload. Metadata-only by
            default.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-4 py-3 font-mono text-sm">
              <code className="truncate">{site.installCommand}</code>
              <CopyButton value={site.installCommand} label="Copy install command" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/docs/getting-started">
              First trace in 5 minutes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={site.github} variant="secondary" external>
              View on GitHub
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {["Open source", "MIT license", "TypeScript", "Local-first"].map(
              (item) => (
                <Badge key={item}>{item}</Badge>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={site.npm} target="_blank" rel="noreferrer noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.badges.npmVersion} alt="npm version" height={20} />
            </a>
            <a href={site.npm} target="_blank" rel="noreferrer noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.badges.npmDownloads}
                alt="npm downloads per month"
                height={20}
              />
            </a>
            <a href={site.github} target="_blank" rel="noreferrer noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.badges.githubStars}
                alt="GitHub stars"
                height={20}
              />
            </a>
            <a href={site.github} target="_blank" rel="noreferrer noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.badges.githubLicense}
                alt="MIT license"
                height={20}
              />
            </a>
          </div>
        </div>

        <TerminalDemo />
      </div>
    </section>
  );
}
