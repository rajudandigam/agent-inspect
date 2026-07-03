import {
  Bug,
  GitPullRequest,
  LineChart,
  Puzzle,
  SquareTerminal,
  TimerOff,
} from "lucide-react";

const cases = [
  {
    title: "Debug a wrong tool call locally",
    body: "See the tool step, siblings, and parent run without leaving your terminal.",
    icon: Bug,
  },
  {
    title: "Attach a safe trace to a PR",
    body: "Redact with the share profile, verify-safe, then attach the local artifact.",
    icon: GitPullRequest,
  },
  {
    title: "Catch stalled agent runs in CI",
    body: "Use deterministic checks for completion and stalls on fixture traces.",
    icon: TimerOff,
  },
  {
    title: "Compare before/after agent behavior",
    body: "Diff two local runs when a prompt, tool, or model change lands.",
    icon: LineChart,
  },
  {
    title: "Build a community adapter",
    body: "Use the adapter SDK and conformance guidance for third-party frameworks.",
    icon: Puzzle,
  },
  {
    title: "Review traces in VS Code without a hosted dashboard",
    body: "Open local JSONL in the in-repo extension while you stay on disk.",
    icon: SquareTerminal,
  },
];

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="scroll-mt-24 border-b border-border bg-surface/50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Where teams use AgentInspect today
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-bg p-5"
            >
              <item.icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
