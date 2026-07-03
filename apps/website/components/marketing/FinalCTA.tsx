import { ButtonLink } from "@/components/shared/ButtonLink";
import { CopyButton } from "@/components/shared/CopyButton";
import { site } from "@/lib/site";

export function FinalCTA() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-primary/30 bg-primary/10 px-6 py-10 sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">
            Get your first local trace in five minutes
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Install AgentInspect, run the deterministic demo, and keep traces on
            your machine.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3 font-mono text-sm">
              <code className="truncate">{site.installCommand}</code>
              <CopyButton value={site.installCommand} label="Copy" />
            </div>
            <ButtonLink href="/docs/getting-started">Read the docs</ButtonLink>
            <ButtonLink href={site.github} variant="secondary" external>
              Star on GitHub
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
