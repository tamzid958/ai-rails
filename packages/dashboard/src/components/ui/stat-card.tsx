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
  const isDollar = typeof value === "string" && value.startsWith("$");
  const prefix = isDollar ? "$" : "";

  return (
    <div
      className={clsx(
        "bg-surface-raised rounded-lg border border-border-subtle p-5 shadow-none",
        "transition-all duration-200 hover:border-border-muted",
        className,
      )}
    >
      <p className="text-xs text-text-tertiary mb-2">{title}</p>
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-light tabular-nums tracking-tight text-text-primary">
          {!isNaN(numericValue) ? (
            <CountUp value={numericValue} prefix={prefix} suffix={isPercentage ? "%" : ""} decimals={isPercentage ? 1 : isDollar ? 2 : 0} />
          ) : value}
        </p>
        {trend && (
          <span className={clsx("inline-flex items-center gap-0.5 text-xs font-medium", isPositive ? "text-success" : "text-danger")}>
            <svg className={clsx("w-3 h-3", !isPositive && "rotate-180")} viewBox="0 0 12 12" fill="currentColor"><path d="M6 2.5l4 5H2l4-5z" /></svg>
            {Math.abs(trend.value)}% <span className="text-text-muted font-normal ml-0.5">{trend.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
