"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissDonutChart } from "@/components/charts/swiss-donut-chart";
import { useChartColors } from "@/components/charts/use-chart-colors";
import { AlertTriangle } from "lucide-react";

export default function TeamCostsPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");
  const chartColors = useChartColors();

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

  const { data: byModel, isLoading: modelLoading } = useQuery({
    queryKey: ["team-cost-model", product.id, period],
    queryFn: () => api.getTeamCostByModel(product.id, period),
  });

  const { data: byTaskType, isLoading: taskTypeLoading } = useQuery({
    queryKey: ["team-cost-task-type", product.id, period],
    queryFn: () => api.getTeamCostByTaskType(product.id, period),
  });

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

      {costStats?.dailyExceeded && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-lg p-4">
          <AlertTriangle size={16} strokeWidth={1.5} className="text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-warning">
            Daily cost threshold exceeded — avg ${costStats.avgPerDay.toFixed(2)}/day exceeds ${costStats.costAlertDaily?.toFixed(2)}/day limit
          </p>
        </div>
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

      <ChartCard title="Cost Trend">
        {trendLoading ? <Skeleton className="h-75" /> : costTrend?.length ? (
          <SwissAreaChart data={costTrend} xKey="date" dataKey="cost" label="Cost (USD)" thresholdValue={costStats?.costAlertDaily ?? undefined} tooltipFormatter={(value) => `$${value.toFixed(2)}`} />
        ) : (
          <p className="text-sm text-text-tertiary py-12 text-center">No cost data for this period.</p>
        )}
      </ChartCard>

      <ChartCard title="By Engineer">
        {engineerLoading ? <Skeleton className="h-48" /> : byEngineer?.length ? (
          <div className="flex flex-col gap-3">
            {byEngineer.map((e, i) => {
              const max = Math.max(...byEngineer.map((x) => x.cost), 1);
              return (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 96, textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                  <div style={{ flex: 1, height: 20, background: "var(--color-surface)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(e.cost / max) * 100}%`, backgroundColor: e.exceeded ? "var(--color-danger)" : chartColors[i % chartColors.length], borderRadius: 2 }} />
                  </div>
                  <span style={{ width: 64, textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)" }} className="tabular-nums">${e.cost.toFixed(2)}</span>
                  {e.exceeded && <span className="text-danger text-xs font-medium">!</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary py-8 text-center">No engineer cost data.</p>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="By Model" className="h-full">
          {modelLoading ? <Skeleton className="h-48" /> : byModel?.length ? (
            <SwissDonutChart items={byModel.map((m) => ({ label: m.model, value: m.count }))} maxItems={5} />
          ) : (
            <p className="text-sm text-text-tertiary py-8 text-center">No model data.</p>
          )}
        </ChartCard>

        <ChartCard title="By Task Type" className="h-full">
          {taskTypeLoading ? <Skeleton className="h-48" /> : byTaskType?.length ? (
            <SwissDonutChart items={byTaskType.map((t) => ({ label: t.taskType, value: t.count }))} maxItems={6} />
          ) : (
            <p className="text-sm text-text-tertiary py-8 text-center">No task type data.</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
