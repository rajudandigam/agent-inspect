import { CodeBlock } from "@/components/shared/CodeBlock";
import { product } from "@/lib/product";

export function FiveMinutePath() {
  return (
    <section
      id="five-minute-path"
      className="scroll-mt-24 border-b border-border bg-surface/50 py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Five-minute path
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            One trace, one check, one safe bundle
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            <code className="text-sm">init</code> scaffolds files; the demo writes the
            trace. Then check, bundle with a share profile, and verify-safe using a
            real run id.
          </p>
          <p className="mt-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            Deterministic starter path — no API keys required.
          </p>
        </div>
        <CodeBlock code={product.fiveMinuteCommands} language="bash" />
      </div>
    </section>
  );
}
