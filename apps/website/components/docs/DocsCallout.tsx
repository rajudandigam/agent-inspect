import { AlertTriangle, Info, Shield } from "lucide-react";
import type { ReactNode } from "react";

import { clsx } from "clsx";

type DocsCalloutProps = {
  title?: string;
  tone?: "info" | "warning" | "safety";
  children: ReactNode;
};

const tones = {
  info: {
    icon: Info,
    className: "border-primary/30 bg-primary/10 text-ink",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-accent/30 bg-accent/10 text-ink",
  },
  safety: {
    icon: Shield,
    className: "border-secondary/30 bg-secondary/10 text-ink",
  },
} as const;

export function DocsCallout({
  title,
  tone = "info",
  children,
}: DocsCalloutProps) {
  const config = tones[tone];
  const Icon = config.icon;

  return (
    <aside
      className={clsx(
        "my-6 rounded-xl border px-4 py-3 text-sm leading-6",
        config.className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={title ? "mt-1 text-muted" : "text-muted"}>{children}</div>
        </div>
      </div>
    </aside>
  );
}
