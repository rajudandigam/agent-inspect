import { clsx } from "clsx";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "accent";
  className?: string;
};

const tones = {
  default: "border-border bg-elevated text-muted",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-secondary/30 bg-secondary/10 text-secondary",
  accent: "border-accent/30 bg-accent/10 text-accent",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
