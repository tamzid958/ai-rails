"use client";

type LegendItem = { label: string; color: string };

export function SwissLegend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color }} />
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
