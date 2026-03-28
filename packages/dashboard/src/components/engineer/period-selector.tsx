"use client";

import clsx from "clsx";
import type { Period } from "@/lib/api-client";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

type PeriodSelectorProps = {
  value: Period;
  onChange: (period: Period) => void;
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-0 border border-gray-200 bg-white">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={clsx(
            "px-3 py-1.5 text-label tracking-[0.06em] font-semibold uppercase transition-colors",
            value === p.value
              ? "bg-gray-900 text-white"
              : "text-gray-400 hover:text-black hover:bg-gray-50",
            "border-r border-gray-200 last:border-r-0",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
