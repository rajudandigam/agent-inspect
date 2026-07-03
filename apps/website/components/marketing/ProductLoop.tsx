import { Eye, ScanSearch, ShieldCheck, TreePine } from "lucide-react";

const steps = [
  {
    title: "Capture",
    body: "Capture manual steps, AI SDK telemetry, OpenAI Agents traces, LangChain callbacks, logs, harness runs, and CI/test artifacts.",
    icon: TreePine,
  },
  {
    title: "Inspect",
    body: "Read local JSONL as trees, timelines, reports, terminal output, viewer artifacts, or editor-friendly traces.",
    icon: Eye,
  },
  {
    title: "Check",
    body: "Turn expectations into deterministic checks for completion, stalls, failures, regressions, and CI review.",
    icon: ScanSearch,
  },
  {
    title: "Redact",
    body: "Create share-safe artifacts before opening issues, reviewing PRs, or talking with design partners.",
    icon: ShieldCheck,
  },
];

export function ProductLoop() {
  return (
    <section id="product-loop" className="scroll-mt-24 border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Product loop
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            The local agent debugging loop
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <step.icon className="h-5 w-5 text-primary" aria-hidden />
                <span className="font-mono text-xs text-muted">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
