"use client";

import Link from "next/link";
import { useState } from "react";

import { docsNav } from "@/lib/docs";
import { clsx } from "clsx";

type DocsMobileNavProps = {
  currentPath: string;
};

export function DocsMobileNav({ currentPath }: DocsMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium"
        aria-expanded={open}
      >
        <span>Docs navigation</span>
        <span className="text-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-4 rounded-xl border border-border bg-surface p-4">
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
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "block rounded-lg px-3 py-2 text-sm",
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
      ) : null}
    </div>
  );
}
