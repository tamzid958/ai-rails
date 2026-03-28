"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useChartColors } from "./use-chart-colors";

type DonutItem = { label: string; value: number };

export function SwissDonutChart({ items: rawItems, height = 200, maxItems = 6 }: { items: DonutItem[]; height?: number; maxItems?: number }) {
  const colors = useChartColors();

  // Group beyond maxItems into "Other"
  const sorted = [...rawItems].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems);
  const items = rest.length > 0
    ? [...top, { label: "Other", value: rest.reduce((s, i) => s + i.value, 0) }]
    : top;

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {items.map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[i % colors.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--color-text-secondary)" }}>{item.label}</span>
              <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }} className="tabular-nums">{item.value}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)", width: 32, textAlign: "right" }} className="tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
