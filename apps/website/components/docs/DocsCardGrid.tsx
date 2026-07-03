import Link from "next/link";

export type DocsCard = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

type DocsCardGridProps = {
  cards: DocsCard[];
};

export function DocsCardGrid({ cards }: DocsCardGridProps) {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {cards.map((card) =>
        card.external ? (
          <a
            key={card.title}
            href={card.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40"
          >
            <h3 className="font-semibold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
          </a>
        ) : (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40"
          >
            <h3 className="font-semibold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
          </Link>
        ),
      )}
    </div>
  );
}
