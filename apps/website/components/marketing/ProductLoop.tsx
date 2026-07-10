import {
  Eye,
  FolderKanban,
  ScanSearch,
  ShieldCheck,
  TreePine,
} from "lucide-react";

const steps = [
  {
    title: "Capture or import",
    body: "Manual steps, adapters, logs, harness, CI artifacts, or OpenInference/OTLP files — local JSONL as source of truth.",
    icon: TreePine,
  },
  {
    title: "Understand causality",
    body: "Trees, timelines, reports, diffs, and sessions show what happened and where it failed.",
    icon: Eye,
  },
  {
    title: "Enforce expectations",
    body: "Deterministic checks, TraceContract (Beta), suites, cohorts, and CI gates.",
    icon: ScanSearch,
  },
  {
    title: "Verify and bundle",
    body: "Redact, verify-safe, and create offline share-profile bundles before you attach evidence.",
    icon: ShieldCheck,
  },
  {
    title: "Review locally or in Studio",
    body: "Local viewer/TUI, or customer-owned Studio Beta over registered workspaces — no AgentInspect cloud.",
    icon: FolderKanban,
  },
];

export function ProductLoop() {
  return (
    <section id="product-loop" className="scroll-mt-24 border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Evidence loop
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            From one broken run to verified-safe evidence
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <step.icon className="h-5 w-5 text-primary" aria-hidden />
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
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
