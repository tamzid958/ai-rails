"use client";

import type { ReactElement } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { SwissTooltip } from "./swiss-tooltip";
import { SwissLegend } from "./swiss-legend";

const CHART_COLORS = [
  "#0047FF",
  "#7A7A7A",
  "#1A8C3A",
  "#C67600",
  "#CC1B1B",
  "#6B4FBB",
];

const AXIS_STYLE = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  fill: "#7A7A7A",
  letterSpacing: "0.06em",
};

type Series = {
  dataKey: string;
  label: string;
  color?: string;
};

type SwissLineChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  tooltipFormatter?: (value: number, name: string) => string;
};

export function SwissLineChart({
  data,
  xKey,
  series,
  height = 300,
  tooltipFormatter,
}: SwissLineChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="#ececec"
            strokeWidth={1}
          />
          <XAxis
            dataKey={xKey}
            tick={AXIS_STYLE}
            axisLine={{ stroke: "#ececec", strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              (<SwissTooltip formatter={tooltipFormatter} />) as ReactElement
            }
          />
          {series.map((s, i) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={s.color ?? CHART_COLORS[i]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: s.color ?? CHART_COLORS[i] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {series.length > 1 && (
        <SwissLegend
          items={series.map((s, i) => ({
            label: s.label,
            color: s.color ?? CHART_COLORS[i],
          }))}
        />
      )}
    </div>
  );
}

type SwissAreaChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  dataKey: string;
  label: string;
  color?: string;
  height?: number;
  thresholdValue?: number;
  tooltipFormatter?: (value: number, name: string) => string;
};

export function SwissAreaChart({
  data,
  xKey,
  dataKey,
  label,
  color = CHART_COLORS[0],
  height = 300,
  thresholdValue,
  tooltipFormatter,
}: SwissAreaChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="#ececec"
            strokeWidth={1}
          />
          <XAxis
            dataKey={xKey}
            tick={AXIS_STYLE}
            axisLine={{ stroke: "#ececec", strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip
            content={
              (<SwissTooltip formatter={tooltipFormatter} />) as ReactElement
            }
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.1}
            name={label}
          />
          {thresholdValue !== undefined && (
            <Line
              type="monotone"
              dataKey={() => thresholdValue}
              stroke="#b8b8b8"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              name="Threshold"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type StackedSeries = {
  dataKey: string;
  label: string;
  color: string;
};

type SwissStackedAreaChartProps = {
  data: Record<string, unknown>[];
  xKey: string;
  series: StackedSeries[];
  height?: number;
  tooltipFormatter?: (value: number, name: string) => string;
};

export function SwissStackedAreaChart({
  data,
  xKey,
  series,
  height = 300,
  tooltipFormatter,
}: SwissStackedAreaChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="#ececec"
            strokeWidth={1}
          />
          <XAxis
            dataKey={xKey}
            tick={AXIS_STYLE}
            axisLine={{ stroke: "#ececec", strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip
            content={
              (<SwissTooltip formatter={tooltipFormatter} />) as ReactElement
            }
          />
          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stackId="1"
              stroke={s.color}
              strokeWidth={1.5}
              fill={s.color}
              fillOpacity={0.15}
              name={s.label}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <SwissLegend
        items={series.map((s) => ({
          label: s.label,
          color: s.color,
        }))}
      />
    </div>
  );
}

export { CHART_COLORS };
