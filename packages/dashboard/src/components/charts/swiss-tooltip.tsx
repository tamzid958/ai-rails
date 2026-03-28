"use client";

type SwissTooltipPayloadEntry = {
  name?: string;
  value?: number;
  color?: string;
};

type SwissTooltipProps = {
  active?: boolean;
  payload?: SwissTooltipPayloadEntry[];
  label?: string;
  formatter?: (value: number, name: string) => string;
};

export function SwissTooltip({ active, payload, label, formatter }: SwissTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-gray-200 bg-white px-2 py-1">
      <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-small tabular-nums">
          <span
            className="inline-block w-[12px] h-[12px] mr-1 align-middle"
            style={{ backgroundColor: entry.color }}
          />
          {formatter
            ? formatter(entry.value ?? 0, entry.name ?? "")
            : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}
