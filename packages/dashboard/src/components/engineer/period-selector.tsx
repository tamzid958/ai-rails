"use client";

import clsx from "clsx";
import type { Period } from "@/lib/api-client";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

type PeriodSelectorProps = { value: Period; onChange: (period: Period) => void };

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border-subtle">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={clsx(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer",
            value === p.value
              ? "bg-surface-overlay text-text-primary shadow-sm"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
