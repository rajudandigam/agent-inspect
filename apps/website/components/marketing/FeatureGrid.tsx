import {
  Boxes,
  FileJson2,
  GitCompare,
  Monitor,
  Network,
  Shield,
  TerminalSquare,
  Workflow,
} from "lucide-react";

const features = [
  {
    title: "Local JSONL traces",
    body: "Own your runs as files under `.agent-inspect/`. No account required.",
    icon: FileJson2,
  },
  {
    title: "Execution trees",
    body: "Nested steps, tool/LLM types, durations, and status in a readable tree.",
    icon: Workflow,
  },
  {
    title: "Metadata-only by default",
    body: "Safe defaults keep prompts and outputs out of traces unless you opt in.",
    icon: Shield,
  },
  {
    title: "Framework adapters",
    body: "AI SDK, OpenAI Agents, LangChain, plus manual and log-ingest paths.",
    icon: Boxes,
  },
  {
    title: "CI checks and reporters",
    body: "Deterministic `check`, `eval`, and Vitest/Jest reporters for PR evidence.",
    icon: TerminalSquare,
  },
  {
    title: "Redaction profiles",
    body: "`local`, `share`, and `strict` profiles before issues, PRs, or partner threads.",
    icon: GitCompare,
  },
  {
    title: "Viewer, TUI, and VS Code surfaces",
    body: "Inspect locally in terminal, localhost viewer, or the in-repo VS Code extension.",
    icon: Monitor,
  },
  {
    title: "OpenTelemetry and OpenInference export path",
    body: "Compatibility-oriented local exports when you need a bridge to platform tooling.",
    icon: Network,
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-b border-border bg-surface/50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Built for the TypeScript agent inner loop
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border bg-bg p-5"
            >
              <feature.icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
