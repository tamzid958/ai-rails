"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissLineChart, SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissHorizontalBar } from "@/components/charts/swiss-bar-chart";

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
        <PageHeader title="Usage Breakdown" />
        <EmptyState
          title="No gateway data"
          description={`This view requires gateway data for ${product.name}. Activity captured via commit tagging does not include token or cost information. To enable: route your AI tool through the AIRails gateway with a ${product.name} API key.`}
          action={
            <code className="font-mono text-mono text-gray-700">
              airails keys create --label &quot;Cursor&quot;
            </code>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <PageHeader title="Usage Breakdown" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Stat Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : usageStats ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatCard
            title="Total Tokens"
            value={usageStats.totalTokens.toLocaleString()}
          />
          <StatCard
            title="Total Cost"
            value={`$${usageStats.totalCost.toFixed(2)}`}
          />
          <StatCard
            title="Avg Latency"
            value={
              usageStats.avgLatency > 0
                ? `${usageStats.avgLatency}ms`
                : "—"
            }
          />
        </div>
      ) : null}

      {/* Token Trend + Model Distribution */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-8 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            Token Trend
          </h3>
          {tokensLoading ? (
            <Skeleton className="h-75" />
          ) : tokenTrend?.length ? (
            <SwissLineChart
              data={tokenTrend}
              xKey="date"
              series={[
                { dataKey: "input", label: "Input" },
                { dataKey: "output", label: "Output" },
              ]}
              tooltipFormatter={(value, name) =>
                `${name}: ${value.toLocaleString()}`
              }
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No token data for this period.
            </p>
          )}
        </div>

        <div className="col-span-4 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            Model Distribution
          </h3>
          {modelsLoading ? (
            <Skeleton className="h-75" />
          ) : models?.length ? (
            <SwissHorizontalBar
              items={models.map((m) => ({ label: m.model, value: m.count }))}
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No model data.
            </p>
          )}
        </div>
      </div>

      {/* Cost Trend + Task Type Breakdown */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            Cost Trend
          </h3>
          {costsLoading ? (
            <Skeleton className="h-75" />
          ) : costTrend?.length ? (
            <SwissAreaChart
              data={costTrend}
              xKey="date"
              dataKey="cost"
              label="Cost (USD)"
              tooltipFormatter={(value) => `$${value.toFixed(2)}`}
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No cost data for this period.
            </p>
          )}
        </div>

        <div className="col-span-4 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            Task Type Breakdown
          </h3>
          {taskTypesLoading ? (
            <Skeleton className="h-75" />
          ) : taskTypes?.length ? (
            <SwissHorizontalBar
              items={taskTypes.map((t) => ({
                label: t.taskType,
                value: t.count,
              }))}
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No task type data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
