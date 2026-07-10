const rows = [
  {
    label: "Local-first",
    agentInspect: "Yes — traces on disk",
    consoleLog: "Yes",
    hosted: "Usually account + ingestion",
    otel: "Depends on collector/backend",
  },
  {
    label: "Account required",
    agentInspect: "No",
    consoleLog: "No",
    hosted: "Usually yes",
    otel: "No for SDK; yes for many backends",
  },
  {
    label: "Upload required",
    agentInspect: "No by default",
    consoleLog: "No",
    hosted: "Usually yes",
    otel: "Exporter/collector dependent",
  },
  {
    label: "Execution tree",
    agentInspect: "Built-in",
    consoleLog: "Flat stream",
    hosted: "Often yes",
    otel: "Spans/traces with setup",
  },
  {
    label: "CI checks",
    agentInspect: "Deterministic CLI checks",
    consoleLog: "Manual",
    hosted: "Platform-specific",
    otel: "Custom pipelines",
  },
  {
    label: "Safe redaction flow",
    agentInspect: "Profiles + verify-safe",
    consoleLog: "Manual",
    hosted: "Varies",
    otel: "Custom",
  },
  {
    label: "Team dashboard",
    agentInspect: "No maintainer-hosted dashboard; optional customer-owned Studio Beta",
    consoleLog: "No",
    hosted: "Yes",
    otel: "Via backend/viewer",
  },
  {
    label: "Production monitoring",
    agentInspect: "Not the goal",
    consoleLog: "No",
    hosted: "Yes",
    otel: "Yes, with platform setup",
  },
  {
    label: "Best for",
    agentInspect:
      "Local debugging, deterministic trajectory regression, safe evidence, customer-owned review",
    consoleLog: "Tiny scripts",
    hosted: "Production fleets and hosted collaboration",
    otel: "Platform observability foundation",
  },
];

export function ComparisonTable() {
  return (
    <section id="compare" className="scroll-mt-24 border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Compare
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Complementary, not a replacement
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Use AgentInspect for the local developer loop. Use hosted platforms or
            OpenTelemetry for production observability. They can complement each
            other.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-elevated">
              <tr>
                <th className="px-4 py-3 font-semibold">Capability</th>
                <th className="px-4 py-3 font-semibold text-primary">agent-inspect</th>
                <th className="px-4 py-3 font-semibold">console.log</th>
                <th className="px-4 py-3 font-semibold">Hosted observability</th>
                <th className="px-4 py-3 font-semibold">Raw OpenTelemetry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <th className="px-4 py-3 align-top font-medium text-ink">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 align-top text-muted">{row.agentInspect}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.consoleLog}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.hosted}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.otel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
