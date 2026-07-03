import { X } from "lucide-react";

const items = [
  "Not a hosted SaaS dashboard",
  "Not a production APM replacement",
  "Not an eval dataset platform",
  "Not a prompt registry",
  "Not a hidden uploader",
  "Not a chain-of-thought recorder",
  "Not a replay engine",
];

export function NotAPlatform() {
  return (
    <section className="border-b border-border bg-surface/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Boundaries
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Local-first by design. Not a hidden platform.
          </h2>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-muted"
            >
              <X className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
