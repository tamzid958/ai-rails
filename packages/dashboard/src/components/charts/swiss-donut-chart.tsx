"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useChartColors } from "./use-chart-colors";

type DonutItem = { label: string; value: number };

export function SwissDonutChart({
  items: rawItems,
  height = 200,
  maxItems = 6,
  centerLabel,
  valueFormatter,
}: {
  items: DonutItem[];
  height?: number;
  maxItems?: number;
  centerLabel?: string;
  valueFormatter?: (value: number) => string;
}) {
  const colors = useChartColors();

  // Group beyond maxItems into "Other"
  const sorted = [...rawItems].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems);
  const items = rest.length > 0
    ? [...top, { label: "Other", value: rest.reduce((s, i) => s + i.value, 0) }]
    : top;

  const total = items.reduce((sum, i) => sum + i.value, 0);
  const formatVal = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              strokeWidth={0}
            >
              {items.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-light tabular-nums text-text-primary">
            {formatVal(total)}
          </span>
          {centerLabel && (
            <span className="text-[10px] text-text-muted">{centerLabel}</span>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-2 mt-3">
        {items.map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="flex-1 text-xs text-text-secondary truncate">{item.label}</span>
              <span className="text-xs tabular-nums text-text-tertiary">{formatVal(item.value)}</span>
              <span className="text-[11px] tabular-nums text-text-muted w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
