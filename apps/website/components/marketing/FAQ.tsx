const faqs = [
  {
    q: "Is AgentInspect a replacement for LangSmith or Langfuse?",
    a: "No. It complements hosted observability tools. AgentInspect focuses on the local developer loop: traces on disk, CLI checks, and safe sharing.",
  },
  {
    q: "What does it capture by default?",
    a: "Metadata-only by default. Prompts and outputs are not captured unless you explicitly opt into content capture settings.",
  },
  {
    q: "Does it upload traces?",
    a: "No upload by default. Traces are local files unless you explicitly export or share them.",
  },
  {
    q: "Which frameworks does it support?",
    a: "Manual instrumentation, Vercel AI SDK (`@agent-inspect/ai-sdk`), OpenAI Agents (`@agent-inspect/openai-agents`), LangChain (`@agent-inspect/langchain`), structured logs, harness, and CI/test reporters.",
  },
  {
    q: "Can I use it in CI?",
    a: "Yes. Run `check`, `eval`, `artifacts`, and `verify-safe` on local traces, then upload redacted artifacts with your CI platform.",
  },
  {
    q: "Can I share traces safely?",
    a: "Use `redact --profile share` (or `strict`) and `verify-safe` before attaching traces to PRs or issues. Profiles are best-effort safeguards, not compliance certifications.",
  },
  {
    q: "Is it production monitoring?",
    a: "No. Use hosted platforms or OpenTelemetry for production fleets and team dashboards.",
  },
  {
    q: "Does it record chain-of-thought?",
    a: "No. AgentInspect does not record chain-of-thought.",
  },
  {
    q: "How much does it cost?",
    a: "It is open source under the MIT license.",
  },
  {
    q: "Where are the docs?",
    a: "Starter docs live under /docs. Canonical GitHub docs remain the full reference during migration.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 border-b border-border bg-surface/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Straight answers
          </h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-bg px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-muted transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
