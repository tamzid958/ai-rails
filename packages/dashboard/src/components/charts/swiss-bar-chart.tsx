"use client";

import clsx from "clsx";
import { useChartColors } from "./use-chart-colors";
import { SwissLegend } from "./swiss-legend";

type BarItem = { label: string; value: number; color?: string };

export function SwissHorizontalBar({
  items,
  className,
  valueFormatter,
}: {
  items: BarItem[];
  className?: string;
  valueFormatter?: (value: number) => string;
}) {
  const colors = useChartColors();
  const max = Math.max(...items.map((i) => i.value), 1);
  const formatVal = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 text-right text-xs text-text-secondary truncate shrink-0">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-surface rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-500 ease-out"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? colors[i % colors.length],
              }}
            />
          </div>
          <span className="w-16 text-right text-xs tabular-nums text-text-secondary shrink-0">
            {formatVal(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

type GroupedBarItem = { label: string; segments: { label: string; value: number; color: string }[] };

export function SwissGroupedBar({
  items,
  className,
  showLegend = true,
}: {
  items: GroupedBarItem[];
  className?: string;
  showLegend?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.segments.reduce((sum, s) => sum + s.value, 0)), 1);

  // Collect unique segment labels for legend
  const legendItems = items.length > 0
    ? items[0].segments.map((s) => ({ label: s.label, color: s.color }))
    : [];

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {showLegend && legendItems.length > 1 && (
        <SwissLegend items={legendItems} />
      )}
      {items.map((item) => {
        const total = item.segments.reduce((sum, s) => sum + s.value, 0);
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs text-text-secondary truncate shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-5 bg-surface rounded-sm overflow-hidden flex">
              {item.segments.map((seg) => (
                <div
                  key={seg.label}
                  className="h-full transition-all duration-500 ease-out first:rounded-l-sm last:rounded-r-sm"
                  style={{ width: `${(seg.value / max) * 100}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${seg.value}`}
                />
              ))}
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-text-muted shrink-0">
              {total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SwissComparisonBar({
  items,
  className,
}: {
  items: { label: string; myValue: number; teamValue: number }[];
  className?: string;
}) {
  const colors = useChartColors();
  const max = Math.max(...items.flatMap((i) => [i.myValue, i.teamValue]), 1);

  return (
    <div className={clsx("flex flex-col gap-5", className)}>
      <SwissLegend items={[{ label: "You", color: colors[0] }, { label: "Team Avg", color: colors[1] }]} />
      {items.map((item) => {
        const diff = item.myValue - item.teamValue;
        const diffLabel = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        return (
          <div key={item.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-medium text-text-tertiary">{item.label}</span>
              <span
                className={clsx(
                  "text-[11px] tabular-nums font-medium",
                  item.label === "Rejection"
                    ? (diff <= 0 ? "text-emerald-400" : "text-red-400")
                    : (diff >= 0 ? "text-emerald-400" : "text-red-400"),
                )}
              >
                {diffLabel}pp
              </span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-12 text-xs text-text-secondary">You</span>
              <div className="flex-1 h-4 bg-surface rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500 ease-out"
                  style={{ width: `${(item.myValue / max) * 100}%`, backgroundColor: colors[0] }}
                />
              </div>
              <span className="w-14 text-right text-xs tabular-nums text-text-primary font-medium">
                {item.myValue.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-xs text-text-muted">Team</span>
              <div className="flex-1 h-4 bg-surface rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500 ease-out"
                  style={{ width: `${(item.teamValue / max) * 100}%`, backgroundColor: colors[1] }}
                />
              </div>
              <span className="w-14 text-right text-xs tabular-nums text-text-muted">
                {item.teamValue.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
