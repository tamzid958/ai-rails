"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightBlock, InsightCallout } from "@/components/ui/insight-block";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissLineChart, SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { Activity, AlertTriangle } from "lucide-react";

export default function UsagePage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: usageStats, isLoading: statsLoading } = useQuery({
    queryKey: ["engineer-usage-stats", product.id, period],
    queryFn: () => api.getUsageStats(product.id, period),
  });

  const { data: tokenTrend, isLoading: tokensLoading } = useQuery({
    queryKey: ["engineer-token-trend", product.id, period],
    queryFn: () => api.getTokenTrend(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

  const { data: costTrend, isLoading: costsLoading } = useQuery({
    queryKey: ["engineer-cost-trend", product.id, period],
    queryFn: () => api.getCostTrend(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

  const { data: models } = useQuery({
    queryKey: ["engineer-models", product.id, period],
    queryFn: () => api.getModelDistribution(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

  const { data: taskTypes } = useQuery({
    queryKey: ["engineer-task-types", product.id, period],
    queryFn: () => api.getTaskTypeBreakdown(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

  // Compute efficiency insights from already-fetched data
  const efficiencyInsights = useMemo(() => {
    if (!usageStats || !usageStats.hasGatewayData) return null;

    const totalRequests = models?.reduce((s, m) => s + m.count, 0) ?? 0;
    const costPerRequest = totalRequests > 0
      ? usageStats.totalCost / totalRequests
      : 0;

    // Token efficiency: output/input ratio — higher = model generates more per token sent
    const totalInput = tokenTrend?.reduce((s, t) => s + t.input, 0) ?? 0;
    const totalOutput = tokenTrend?.reduce((s, t) => s + t.output, 0) ?? 0;
    const outputRatio = totalInput > 0 ? totalOutput / totalInput : 0;

    // Most used model
    const topModel = models?.length
      ? [...models].sort((a, b) => b.count - a.count)[0]
      : null;

    // Most expensive task type (by volume — proxy for cost)
    const topTaskType = taskTypes?.length
      ? [...taskTypes].sort((a, b) => b.count - a.count)[0]
      : null;

    return { costPerRequest, outputRatio, totalRequests, topModel, topTaskType };
  }, [usageStats, models, tokenTrend, taskTypes]);

  if (!statsLoading && usageStats && !usageStats.hasGatewayData) {
    return (
      <div>
        <PageHeader title="Usage" />
        <EmptyState
          icon={<Activity size={28} strokeWidth={1} />}
          title="No gateway data"
          description={`This view requires gateway data for ${product.name}. Route your AI tool through the AIRAILS gateway to see token and cost breakdowns.`}
          action={
            <code className="font-mono text-xs text-text-tertiary">
              airails keys create --label &quot;Cursor&quot;
            </code>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Usage" className="mb-0 pb-0" />
        <div className="mt-3 sm:mt-0">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : usageStats ? (
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard title="Total Tokens" value={usageStats.totalTokens.toLocaleString()} />
          <StatCard title="Total Cost" value={`$${usageStats.totalCost.toFixed(2)}`} />
          <StatCard title="Avg Latency" value={usageStats.avgLatency > 0 ? `${usageStats.avgLatency}ms` : "—"} />
        </div>
      ) : null}

      {/* Efficiency callout */}
      {efficiencyInsights && efficiencyInsights.outputRatio > 2 && (
        <InsightCallout icon={<AlertTriangle size={14} />} variant="warning">
          Output/input ratio is {efficiencyInsights.outputRatio.toFixed(1)}x — consider shorter prompts or constraining output length to reduce cost
        </InsightCallout>
      )}

      {/* Efficiency breakdown — replaces model & task type donuts */}
      {efficiencyInsights && (
        <InsightBlock
          items={[
            {
              label: "Cost per request",
              value: `$${efficiencyInsights.costPerRequest.toFixed(4)}`,
              detail: `${efficiencyInsights.totalRequests.toLocaleString()} total requests`,
            },
            {
              label: "Output/input ratio",
              value: `${efficiencyInsights.outputRatio.toFixed(2)}x`,
              detail: efficiencyInsights.outputRatio > 1.5 ? "model generates more than you send" : "balanced prompting",
              sentiment: efficiencyInsights.outputRatio <= 1.5 ? "positive" : "neutral",
            },
            ...(efficiencyInsights.topModel ? [{
              label: "Primary model",
              value: efficiencyInsights.topModel.model,
              detail: `${efficiencyInsights.topModel.count} requests`,
            }] : []),
            ...(efficiencyInsights.topTaskType ? [{
              label: "Top task type",
              value: efficiencyInsights.topTaskType.taskType,
              detail: `${efficiencyInsights.topTaskType.count} sessions`,
            }] : []),
          ]}
        />
      )}

      {/* Token Trend — answers: "Am I burning more tokens over time?" */}
      <ChartCard
        title="Token Consumption"
        description="Daily input vs output tokens — a growing gap signals prompt bloat or unconstrained output"
      >
        {tokensLoading ? <Skeleton className="h-75" /> : tokenTrend?.length ? (
          <SwissLineChart
            data={tokenTrend}
            xKey="date"
            series={[
              { dataKey: "input", label: "Input Tokens" },
              { dataKey: "output", label: "Output Tokens" },
            ]}
            tooltipFormatter={(v, name) => `${name}: ${v.toLocaleString()} tokens`}
          />
        ) : (
          <EmptyState title="No token data" description="No gateway-captured tokens for this period." compact />
        )}
      </ChartCard>

      {/* Cost Trend — answers: "Is my spend under control?" */}
      <ChartCard
        title="Cost Trend"
        description="Daily spend — identify spikes before they compound into budget overruns"
      >
        {costsLoading ? <Skeleton className="h-75" /> : costTrend?.length ? (
          <SwissAreaChart
            data={costTrend}
            xKey="date"
            dataKey="cost"
            label="Cost (USD)"
            tooltipFormatter={(v) => `$${v.toFixed(2)}`}
            yAxisFormatter={(v) => `$${v}`}
          />
        ) : (
          <EmptyState title="No cost data" description="No gateway-captured costs for this period." compact />
        )}
      </ChartCard>
    </div>
  );
}
