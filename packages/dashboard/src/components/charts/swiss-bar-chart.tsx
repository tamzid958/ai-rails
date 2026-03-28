"use client";

import clsx from "clsx";
import { useChartColors } from "./use-chart-colors";

type BarItem = { label: string; value: number };

export function SwissHorizontalBar({ items, className }: { items: BarItem[]; className?: string }) {
  const colors = useChartColors();
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 96, textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <div style={{ flex: 1, height: 20, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(item.value / max) * 100}%`, backgroundColor: colors[i % colors.length], borderRadius: 2, transition: "width 500ms ease-out" }} />
          </div>
          <span style={{ width: 40, textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)" }} className="tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

type GroupedBarItem = { label: string; segments: { label: string; value: number; color: string }[] };

export function SwissGroupedBar({ items, className }: { items: GroupedBarItem[]; className?: string }) {
  const max = Math.max(...items.map((i) => i.segments.reduce((sum, s) => sum + s.value, 0)), 1);

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 96, textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <div style={{ flex: 1, height: 20, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden", display: "flex" }}>
            {item.segments.map((seg) => (
              <div key={seg.label} style={{ height: "100%", width: `${(seg.value / max) * 100}%`, backgroundColor: seg.color }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SwissComparisonBar({ items, className }: { items: { label: string; myValue: number; teamValue: number }[]; className?: string }) {
  const colors = useChartColors();
  const max = Math.max(...items.flatMap((i) => [i.myValue, i.teamValue]), 1);

  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 6 }}>{item.label}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ width: 48, fontSize: 13, color: "var(--color-text-secondary)" }}>You</span>
            <div style={{ flex: 1, height: 16, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(item.myValue / max) * 100}%`, backgroundColor: colors[0], borderRadius: 2 }} />
            </div>
            <span style={{ width: 56, textAlign: "right", fontSize: 13, color: "var(--color-text-primary)" }} className="tabular-nums">{item.myValue.toFixed(1)}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 48, fontSize: 13, color: "var(--color-text-tertiary)" }}>Team</span>
            <div style={{ flex: 1, height: 16, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(item.teamValue / max) * 100}%`, backgroundColor: colors[1], borderRadius: 2 }} />
            </div>
            <span style={{ width: 56, textAlign: "right", fontSize: 13, color: "var(--color-text-tertiary)" }} className="tabular-nums">{item.teamValue.toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
