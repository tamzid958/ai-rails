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
    <div className="flex gap-0 border border-gray-200">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={clsx(
            "px-2 py-1 text-small font-medium",
            value === p.value
              ? "bg-black text-white"
              : "bg-white text-gray-700 hover:bg-gray-50",
            "border-r border-gray-200 last:border-r-0",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
