"use client";

import clsx from "clsx";

const CHART_COLORS = [
  "#0047FF",
  "#7A7A7A",
  "#1A8C3A",
  "#C67600",
  "#CC1B1B",
  "#6B4FBB",
];

type BarItem = {
  label: string;
  value: number;
};

type SwissHorizontalBarProps = {
  items: BarItem[];
  className?: string;
};

export function SwissHorizontalBar({ items, className }: SwissHorizontalBarProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-small text-gray-700 w-24 text-right truncate">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-gray-50">
            <div
              className="h-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
          <span className="text-small tabular-nums text-gray-700 w-10 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

type GroupedBarItem = {
  label: string;
  segments: { label: string; value: number; color: string }[];
};

type SwissGroupedBarProps = {
  items: GroupedBarItem[];
  className?: string;
};

export function SwissGroupedBar({ items, className }: SwissGroupedBarProps) {
  const max = Math.max(
    ...items.map((i) => i.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-small text-gray-700 w-24 text-right truncate">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-gray-50 flex">
            {item.segments.map((seg) => (
              <div
                key={seg.label}
                className="h-full"
                style={{
                  width: `${(seg.value / max) * 100}%`,
                  backgroundColor: seg.color,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type ComparisonBarProps = {
  items: { label: string; myValue: number; teamValue: number }[];
  className?: string;
};

export function SwissComparisonBar({ items, className }: ComparisonBarProps) {
  const max = Math.max(
    ...items.flatMap((i) => [i.myValue, i.teamValue]),
    1,
  );

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
            {item.label}
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-small text-gray-700 w-16">You</span>
            <div className="flex-1 h-4 bg-gray-50">
              <div
                className="h-full bg-accent"
                style={{ width: `${(item.myValue / max) * 100}%` }}
              />
            </div>
            <span className="text-small tabular-nums w-14 text-right">
              {item.myValue.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-small text-gray-500 w-16">Team</span>
            <div className="flex-1 h-4 bg-gray-50">
              <div
                className="h-full bg-gray-300"
                style={{ width: `${(item.teamValue / max) * 100}%` }}
              />
            </div>
            <span className="text-small tabular-nums text-gray-500 w-14 text-right">
              {item.teamValue.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
