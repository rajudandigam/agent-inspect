import { CodeBlock } from "@/components/shared/CodeBlock";

const commands = `npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect check .agent-inspect/*.jsonl --require-completed --detect-stalls
npx agent-inspect redact --profile share --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect`;

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
            One trace, one check, one safe artifact
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Install, run the deterministic demo, inspect the tree, check
            completion and stalls, then redact before you share.
          </p>
          <p className="mt-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            The deterministic starter path works without API keys.
          </p>
        </div>
        <CodeBlock code={commands} language="bash" />
      </div>
    </section>
  );
}
