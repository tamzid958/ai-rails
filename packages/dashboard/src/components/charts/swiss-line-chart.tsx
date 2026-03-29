"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ReferenceLine } from "recharts";
import { SwissTooltip } from "./swiss-tooltip";
import { SwissLegend } from "./swiss-legend";
import { useChartColors, useThemeVars } from "./use-chart-colors";

type Series = { dataKey: string; label: string; color?: string };

/** Format ISO date string or "2024-W12" week label to short readable form */
function formatDateLabel(raw: string): string {
  if (raw.includes("W")) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format large Y-axis numbers: 1200 → "1.2K", 1500000 → "1.5M" */
function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function SwissLineChart({
  data,
  xKey,
  series,
  height = 300,
  tooltipFormatter,
  yAxisFormatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  tooltipFormatter?: (v: number, n: string) => string;
  yAxisFormatter?: (v: number) => string;
}) {
  const colors = useChartColors();
  const { grid, axisFill } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };
  const formatY = yAxisFormatter ?? formatAxisValue;

  return (
    <div>
      <div className="-mx-1">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
            <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} tickFormatter={formatDateLabel} />
            <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={formatY} width={48} />
            <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} labelFormatter={formatDateLabel} />) as ReactElement} />
            {series.map((s, i) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color ?? colors[i]} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: s.color ?? colors[i] }} name={s.label} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && <SwissLegend items={series.map((s, i) => ({ label: s.label, color: s.color ?? colors[i] }))} />}
    </div>
  );
}

export function SwissAreaChart({
  data,
  xKey,
  dataKey,
  label,
  color,
  height = 300,
  thresholdValue,
  thresholdLabel,
  tooltipFormatter,
  yAxisFormatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  dataKey: string;
  label: string;
  color?: string;
  height?: number;
  thresholdValue?: number;
  thresholdLabel?: string;
  tooltipFormatter?: (v: number, n: string) => string;
  yAxisFormatter?: (v: number) => string;
}) {
  const colors = useChartColors();
  const { grid, axisFill, borderMuted } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };
  const c = color ?? colors[0];
  const formatY = yAxisFormatter ?? formatAxisValue;

  return (
    <div className="-mx-1">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} tickFormatter={formatDateLabel} />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={formatY} width={48} />
          <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} labelFormatter={formatDateLabel} />) as ReactElement} />
          <Area type="monotone" dataKey={dataKey} stroke={c} strokeWidth={2} fill={c} fillOpacity={0.15} name={label} />
          {thresholdValue !== undefined && (
            <ReferenceLine
              y={thresholdValue}
              stroke={borderMuted}
              strokeWidth={1}
              strokeDasharray="6 3"
              label={thresholdLabel ? { value: thresholdLabel, position: "insideTopRight", fontSize: 10, fill: axisFill } : undefined}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SwissStackedAreaChart({
  data,
  xKey,
  series,
  height = 300,
  tooltipFormatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { dataKey: string; label: string; color: string }[];
  height?: number;
  tooltipFormatter?: (v: number, n: string) => string;
}) {
  const { grid, axisFill } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };

  return (
    <div>
      <div className="-mx-1">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
            <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} tickFormatter={formatDateLabel} />
            <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={formatAxisValue} width={48} />
            <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} labelFormatter={formatDateLabel} />) as ReactElement} />
            {series.map((s) => (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} stackId="1" stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.2} name={s.label} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SwissLegend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  );
}

export { useChartColors as CHART_COLORS_HOOK };

export const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#34d399", "#fbbf24", "#f87171", "#f472b6"];
