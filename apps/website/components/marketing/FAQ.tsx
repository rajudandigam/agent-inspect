const faqs = [
  {
    q: "Does AgentInspect upload traces?",
    a: "No default upload and no hidden telemetry. Traces stay on disk unless you explicitly share a file, enable customer-owned Studio ingest, or configure a standards export.",
  },
  {
    q: "What can explicitly use the network?",
    a: "Optional Studio GitHub/HTTP ingest (off by default), MCP clients talking to your servers, MCP server exposing local evidence to a connected client, and any standards/collector path you configure. See Network behavior docs.",
  },
  {
    q: "Is Studio hosted by AgentInspect?",
    a: "No. Studio Beta is customer-owned and binds to localhost by default. There is no AgentInspect-hosted cloud dashboard.",
  },
  {
    q: "Is this production APM?",
    a: "No. Use hosted platforms or OpenTelemetry for production fleets. AgentInspect is for local debugging, deterministic trajectory regression, and safe evidence.",
  },
  {
    q: "What is Stable / Beta / Preview?",
    a: "Support levels describe maturity. Core schema/checks/redaction are Stable; TraceContract/suites/index/Studio are Beta; MCP server and some ingest paths are Preview. See SUPPORT-LEVELS.md on GitHub.",
  },
  {
    q: "Does it record prompts, outputs, or chain-of-thought?",
    a: "Capture is metadata-only by default. It does not record chain-of-thought. Opt into content capture only when you intentionally need it.",
  },
  {
    q: "How do contracts differ from evals?",
    a: "TraceContract and checks are deterministic trajectory expectations. Eval helpers are local heuristics. Neither is an LLM judge by default.",
  },
  {
    q: "Why is v7 not scheduled?",
    a: "v7 is conditional on real external adoption evidence (design partners and pilot teams). Completing code is not enough.",
  },
  {
    q: "Where are the full docs?",
    a: "This site summarizes the product. Canonical deep reference lives on GitHub under docs/.",
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
