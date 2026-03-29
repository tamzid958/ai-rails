"use client";

type SwissTooltipPayloadEntry = { name?: string; value?: number; color?: string };
type SwissTooltipProps = { active?: boolean; payload?: SwissTooltipPayloadEntry[]; label?: string; formatter?: (value: number, name: string) => string; labelFormatter?: (label: string) => string };

export function SwissTooltip({ active, payload, label, formatter, labelFormatter }: SwissTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter && label ? labelFormatter(label) : label;

  return (
    <div className="rounded-lg border border-border-muted bg-surface-overlay px-3 py-2 shadow-md">
      {displayLabel && (
        <p className="text-[11px] text-text-muted mb-1">{displayLabel}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 tabular-nums text-[13px] text-text-primary">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-medium">
            {formatter ? formatter(entry.value ?? 0, entry.name ?? "") : (entry.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
