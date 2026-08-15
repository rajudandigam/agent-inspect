import { product } from "@/lib/product";

export function Pillars() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Three jobs
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            One local evidence loop
          </h2>
          <p className="mt-3 text-muted">
            Capture once. Debug the tree, prevent the wrong trajectory, and share-checked
            Evidence v2. Optional read-only MCP stays below the fold.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {product.pillars.map((pillar, index) => (
            <article
              key={pillar.id}
              className="rounded-2xl border border-border bg-surface/40 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{pillar.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
