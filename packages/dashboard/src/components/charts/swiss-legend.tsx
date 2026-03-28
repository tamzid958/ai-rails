"use client";

type LegendItem = {
  label: string;
  color: string;
};

type SwissLegendProps = {
  items: LegendItem[];
};

export function SwissLegend({ items }: SwissLegendProps) {
  return (
    <div className="flex gap-3 mt-2 justify-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span
            className="inline-block w-[12px] h-[12px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-label uppercase text-gray-500 tracking-[0.06em]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
