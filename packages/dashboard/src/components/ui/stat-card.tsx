"use client";

import clsx from "clsx";
import { CountUp } from "../motion/count-up";

type StatCardProps = {
  title: string;
  value: string | number;
  trend?: { value: number; label: string };
  className?: string;
};

function StatCard({ title, value, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  const isPercentage = typeof value === "string" && value.includes("%");
  const prefix = typeof value === "string" && value.startsWith("$") ? "$" : "";

  return (
    <div
      className={clsx(
        "bg-surface-raised rounded-lg border border-border-subtle p-5 flex flex-col justify-between min-h-28 shadow-none",
        "transition-all duration-200 hover:shadow-md hover:border-border-muted",
        className,
      )}
    >
      <p className="text-sm font-medium text-text-tertiary">{title}</p>
      <div className="mt-3">
        <p className="text-3xl font-light tabular-nums tracking-tight text-text-primary">
          {!isNaN(numericValue) ? (
            <CountUp value={numericValue} prefix={prefix} suffix={isPercentage ? "%" : ""} decimals={isPercentage ? 1 : 0} />
          ) : value}
        </p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={clsx("inline-flex items-center gap-0.5 text-xs font-medium", isPositive ? "text-success" : "text-danger")}>
              <svg className={clsx("w-3 h-3", !isPositive && "rotate-180")} viewBox="0 0 12 12" fill="currentColor"><path d="M6 2.5l4 5H2l4-5z" /></svg>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-text-tertiary">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
