"use client";

type SwissTooltipPayloadEntry = { name?: string; value?: number; color?: string };
type SwissTooltipProps = { active?: boolean; payload?: SwissTooltipPayloadEntry[]; label?: string; formatter?: (value: number, name: string) => string };

export function SwissTooltip({ active, payload, label, formatter }: SwissTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border-muted)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ fontSize: 13, color: "var(--color-text-primary)" }} className="tabular-nums">
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, verticalAlign: "middle", backgroundColor: entry.color }} />
          {formatter ? formatter(entry.value ?? 0, entry.name ?? "") : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}
