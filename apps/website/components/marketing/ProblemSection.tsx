import { GitBranch, Layers, ShieldAlert, Timer } from "lucide-react";

const cards = [
  {
    title: "Flat logs hide nested decisions",
    body: "You see a tool name, not the parent run, siblings, or where the branch went wrong.",
    icon: Layers,
  },
  {
    title: "Parallel tool calls get interleaved",
    body: "Concurrent work collapses into a stream of lines without step boundaries.",
    icon: GitBranch,
  },
  {
    title: "Hosted dashboards slow the local loop",
    body: "Accounts, ingestion, and dashboards are great for fleets — not for the first failing run on your laptop.",
    icon: Timer,
  },
  {
    title: "Raw traces can leak customer data",
    body: "Without redaction and verify-safe, PR and issue attachments can expose more than you intended.",
    icon: ShieldAlert,
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-24 border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            console.log was not built for agents
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Agent runs are nested, parallel, tool-heavy, and privacy-sensitive.
            Flat logs tell you something happened. They rarely show what happened
            in order, where it branched, or what is safe to share.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <card.icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
