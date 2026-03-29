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
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissHorizontalBar } from "@/components/charts/swiss-bar-chart";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function TeamCostsPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: costStats, isLoading: statsLoading } = useQuery({
    queryKey: ["team-cost-stats", product.id, period],
    queryFn: () => api.getTeamCostStats(product.id, period),
  });

  const { data: costTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["team-cost-trend", product.id, period],
    queryFn: () => api.getTeamCostTrend(product.id, period),
  });

  const { data: byEngineer, isLoading: engineerLoading } = useQuery({
    queryKey: ["team-cost-engineer", product.id, period],
    queryFn: () => api.getTeamCostByEngineer(product.id, period),
  });

  const { data: byModel } = useQuery({
    queryKey: ["team-cost-model", product.id, period],
    queryFn: () => api.getTeamCostByModel(product.id, period),
  });

  const { data: byTaskType } = useQuery({
    queryKey: ["team-cost-task-type", product.id, period],
    queryFn: () => api.getTeamCostByTaskType(product.id, period),
  });

  // Compute budget and efficiency insights — replaces filler donuts
  const budgetInsights = useMemo(() => {
    if (!costStats) return null;

    // Projected monthly cost from current daily average
    const projectedMonthly = costStats.avgPerDay * 30;

    // Budget utilization
    const budgetUsed = costStats.costAlertDaily
      ? Math.round((costStats.avgPerDay / costStats.costAlertDaily) * 100)
      : null;

    // Top model by volume (proxy for cost driver)
    const topModel = byModel?.length
      ? [...byModel].sort((a, b) => b.count - a.count)[0]
      : null;

    // Top task type
    const topTaskType = byTaskType?.length
      ? [...byTaskType].sort((a, b) => b.count - a.count)[0]
      : null;

    // Engineers exceeding threshold
    const exceededCount = byEngineer?.filter((e) => e.exceeded).length ?? 0;

    return { projectedMonthly, budgetUsed, topModel, topTaskType, exceededCount };
  }, [costStats, byModel, byTaskType, byEngineer]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageHeader title="Cost Center" className="mb-0 pb-0" />
          <p className="text-xs text-text-muted mt-1">Gateway-captured activity only</p>
        </div>
        <div className="mt-3 sm:mt-0">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Alert callouts */}
      {costStats?.dailyExceeded && (
        <InsightCallout icon={<AlertTriangle size={14} />} variant="warning">
          Daily cost threshold exceeded — avg ${costStats.avgPerDay.toFixed(2)}/day exceeds ${costStats.costAlertDaily?.toFixed(2)}/day limit
        </InsightCallout>
      )}
      {budgetInsights && budgetInsights.exceededCount > 0 && !costStats?.dailyExceeded && (
        <InsightCallout icon={<AlertTriangle size={14} />} variant="warning">
          {budgetInsights.exceededCount} engineer{budgetInsights.exceededCount > 1 ? "s" : ""} exceeded their individual cost threshold
        </InsightCallout>
      )}
      {budgetInsights && budgetInsights.budgetUsed !== null && budgetInsights.budgetUsed !== undefined && budgetInsights.budgetUsed < 50 && (
        <InsightCallout icon={<TrendingUp size={14} />} variant="success">
          Budget is healthy — using {budgetInsights.budgetUsed}% of daily limit with room to scale
        </InsightCallout>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : costStats ? (
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard title="Product Total" value={`$${costStats.productTotal.toFixed(2)}`} />
          <StatCard title="Avg / Day" value={`$${costStats.avgPerDay.toFixed(2)}`} />
          <StatCard title="Avg / Engineer" value={`$${costStats.avgPerEngineer.toFixed(2)}`} />
        </div>
      ) : null}

      {/* Budget & efficiency insights — replaces model/task-type donuts */}
      {budgetInsights && (
        <InsightBlock
          items={[
            {
              label: "Projected monthly cost",
              value: `$${budgetInsights.projectedMonthly.toFixed(2)}`,
              detail: "at current daily rate",
              sentiment: budgetInsights.budgetUsed !== null && budgetInsights.budgetUsed > 90 ? "negative" : "neutral",
            },
            ...(budgetInsights.budgetUsed !== null ? [{
              label: "Daily budget utilization",
              value: `${budgetInsights.budgetUsed}%`,
              detail: `$${costStats?.avgPerDay.toFixed(2)} of $${costStats?.costAlertDaily?.toFixed(2)} limit`,
              sentiment: (budgetInsights.budgetUsed <= 70 ? "positive" : budgetInsights.budgetUsed > 100 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
            }] : []),
            ...(budgetInsights.topModel ? [{
              label: "Highest-volume model",
              value: budgetInsights.topModel.model,
              detail: `${budgetInsights.topModel.count} requests — primary cost driver`,
            }] : []),
            ...(budgetInsights.topTaskType ? [{
              label: "Most expensive task type",
              value: budgetInsights.topTaskType.taskType,
              detail: `${budgetInsights.topTaskType.count} sessions`,
            }] : []),
          ]}
        />
      )}

      {/* Cost Trend — answers: "Is our spend under control?" */}
      <ChartCard
        title="Cost Trend"
        description="Daily team spend — dashed line shows budget threshold, spikes warrant investigation"
      >
        {trendLoading ? <Skeleton className="h-75" /> : costTrend?.length ? (
          <SwissAreaChart
            data={costTrend}
            xKey="date"
            dataKey="cost"
            label="Cost (USD)"
            thresholdValue={costStats?.costAlertDaily ?? undefined}
            thresholdLabel={costStats?.costAlertDaily ? `Budget $${costStats.costAlertDaily}/day` : undefined}
            tooltipFormatter={(v) => `$${v.toFixed(2)}`}
            yAxisFormatter={(v) => `$${v}`}
          />
        ) : (
          <EmptyState title="No cost data" description="No gateway-captured costs for this period." compact />
        )}
      </ChartCard>

      {/* Cost by Engineer — answers: "Who's driving spend?" */}
      <ChartCard
        title="Spend by Engineer"
        description="Ranked by total cost — red bars indicate engineers exceeding their individual threshold"
      >
        {engineerLoading ? <Skeleton className="h-48" /> : byEngineer?.length ? (
          <SwissHorizontalBar
            items={byEngineer.map((e) => ({
              label: e.name,
              value: e.cost,
              color: e.exceeded ? "var(--color-danger)" : undefined,
            }))}
            valueFormatter={(v) => `$${v.toFixed(2)}`}
          />
        ) : (
          <EmptyState title="No engineer cost data" compact />
        )}
      </ChartCard>
    </div>
  );
}
