"use client";

type LegendItem = { label: string; color: string };

export function SwissLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 justify-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-text-tertiary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
