"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";
import { SwissTooltip } from "./swiss-tooltip";
import { SwissLegend } from "./swiss-legend";
import { useChartColors, useThemeVars } from "./use-chart-colors";

type Series = { dataKey: string; label: string; color?: string };

export function SwissLineChart({ data, xKey, series, height = 300, tooltipFormatter }: { data: Record<string, unknown>[]; xKey: string; series: Series[]; height?: number; tooltipFormatter?: (v: number, n: string) => string }) {
  const colors = useChartColors();
  const { grid, axisFill } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} />) as ReactElement} />
          {series.map((s, i) => <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color ?? colors[i]} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: s.color ?? colors[i] }} />)}
        </LineChart>
      </ResponsiveContainer>
      {series.length > 1 && <SwissLegend items={series.map((s, i) => ({ label: s.label, color: s.color ?? colors[i] }))} />}
    </div>
  );
}

export function SwissAreaChart({ data, xKey, dataKey, label, color, height = 300, thresholdValue, tooltipFormatter }: { data: Record<string, unknown>[]; xKey: string; dataKey: string; label: string; color?: string; height?: number; thresholdValue?: number; tooltipFormatter?: (v: number, n: string) => string }) {
  const colors = useChartColors();
  const { grid, axisFill, borderMuted } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };
  const c = color ?? colors[0];

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} />) as ReactElement} />
          <Area type="monotone" dataKey={dataKey} stroke={c} strokeWidth={2} fill={c} fillOpacity={0.15} name={label} />
          {thresholdValue !== undefined && <Line type="monotone" dataKey={() => thresholdValue} stroke={borderMuted} strokeWidth={1} strokeDasharray="4 4" dot={false} activeDot={false} name="Threshold" />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SwissStackedAreaChart({ data, xKey, series, height = 300, tooltipFormatter }: { data: Record<string, unknown>[]; xKey: string; series: { dataKey: string; label: string; color: string }[]; height?: number; tooltipFormatter?: (v: number, n: string) => string }) {
  const { grid, axisFill } = useThemeVars();
  const axis = { fontSize: 11, fill: axisFill, fontWeight: 500 as const };

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid horizontal vertical={false} stroke={grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={axis} axisLine={{ stroke: grid }} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip content={(<SwissTooltip formatter={tooltipFormatter} />) as ReactElement} />
          {series.map((s) => <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} stackId="1" stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.2} name={s.label} />)}
        </AreaChart>
      </ResponsiveContainer>
      <SwissLegend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  );
}

export { useChartColors as CHART_COLORS_HOOK };

// Static fallback for pages that pass colors directly
export const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#34d399", "#fbbf24", "#f87171", "#f472b6"];
