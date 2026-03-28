"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissLineChart, SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissDonutChart } from "@/components/charts/swiss-donut-chart";
import { Activity } from "lucide-react";

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

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["engineer-models", product.id, period],
    queryFn: () => api.getModelDistribution(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

  const { data: taskTypes, isLoading: taskTypesLoading } = useQuery({
    queryKey: ["engineer-task-types", product.id, period],
    queryFn: () => api.getTaskTypeBreakdown(product.id, period),
    enabled: usageStats?.hasGatewayData !== false,
  });

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
          <StatCard title="Avg Latency" value={usageStats.avgLatency > 0 ? `${usageStats.avgLatency}ms` : "\u2014"} />
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <ChartCard title="Token Trend" className="h-full">
            {tokensLoading ? <Skeleton className="h-75" /> : tokenTrend?.length ? (
              <SwissLineChart data={tokenTrend} xKey="date" series={[{ dataKey: "input", label: "Input" }, { dataKey: "output", label: "Output" }]} tooltipFormatter={(value, name) => `${name}: ${value.toLocaleString()}`} />
            ) : (
              <p className="text-sm text-text-tertiary py-12 text-center">No token data for this period.</p>
            )}
          </ChartCard>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Model Distribution" className="h-full">
            {modelsLoading ? <Skeleton className="h-75" /> : models?.length ? (
              <SwissDonutChart items={models.map((m) => ({ label: m.model, value: m.count }))} maxItems={5} />
            ) : (
              <p className="text-sm text-text-tertiary py-12 text-center">No model data.</p>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <ChartCard title="Cost Trend" className="h-full">
            {costsLoading ? <Skeleton className="h-75" /> : costTrend?.length ? (
              <SwissAreaChart data={costTrend} xKey="date" dataKey="cost" label="Cost (USD)" tooltipFormatter={(value) => `$${value.toFixed(2)}`} />
            ) : (
              <p className="text-sm text-text-tertiary py-12 text-center">No cost data for this period.</p>
            )}
          </ChartCard>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Task Types" className="h-full">
            {taskTypesLoading ? <Skeleton className="h-75" /> : taskTypes?.length ? (
              <SwissDonutChart items={taskTypes.map((t) => ({ label: t.taskType, value: t.count }))} maxItems={5} />
            ) : (
              <p className="text-sm text-text-tertiary py-12 text-center">No task type data.</p>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
