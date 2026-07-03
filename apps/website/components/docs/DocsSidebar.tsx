import Link from "next/link";

import { docsNav } from "@/lib/docs";
import { clsx } from "clsx";

type DocsSidebarProps = {
  currentPath: string;
};

export function DocsSidebar({ currentPath }: DocsSidebarProps) {
  return (
    <nav aria-label="Docs" className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {docsNav.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {section.title}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active =
                  currentPath === item.href ||
                  currentPath === `${item.href}/`;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "block rounded-lg px-3 py-2 text-sm transition",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted hover:bg-elevated hover:text-ink",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
