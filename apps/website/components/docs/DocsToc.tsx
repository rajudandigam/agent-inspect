import type { DocTocItem } from "@/lib/docs";

type DocsTocProps = {
  items?: DocTocItem[];
};

export function DocsToc({ items }: DocsTocProps) {
  if (!items?.length) {
    return null;
  }

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          On this page
        </p>
        <ul className="mt-3 space-y-2 border-l border-border pl-3 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-muted transition hover:text-ink"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
