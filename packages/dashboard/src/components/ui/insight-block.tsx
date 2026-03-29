import clsx from "clsx";
import type { ReactNode } from "react";

type InsightItem = {
  label: string;
  value: string | number;
  detail?: string;
  sentiment?: "positive" | "negative" | "neutral";
};

type InsightBlockProps = {
  items: InsightItem[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
};

const COL_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

function InsightBlock({ items, className, columns }: InsightBlockProps) {
  if (items.length === 0) return null;

  const cols = columns ?? (Math.min(items.length, 4) as 1 | 2 | 3 | 4);

  return (
    <div className={clsx("grid gap-4", COL_CLASS[cols], className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-4"
        >
          <p className="text-[11px] text-text-muted mb-2">{item.label}</p>
          <p
            className={clsx(
              "text-xl font-light tabular-nums tracking-tight",
              item.sentiment === "positive" && "text-emerald-400",
              item.sentiment === "negative" && "text-red-400",
              (!item.sentiment || item.sentiment === "neutral") && "text-text-primary",
            )}
          >
            {item.value}
          </p>
          {item.detail && (
            <p className="text-[10px] text-text-muted mt-1">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}

type CalloutProps = {
  icon?: ReactNode;
  children: ReactNode;
  variant?: "info" | "success" | "warning";
  className?: string;
};

function InsightCallout({ icon, children, variant = "info", className }: CalloutProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs",
        variant === "info" && "border-accent/20 bg-accent/5 text-accent",
        variant === "success" && "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
        variant === "warning" && "border-amber-500/20 bg-amber-500/5 text-amber-400",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

export { InsightBlock, InsightCallout };
export type { InsightItem, InsightBlockProps };
