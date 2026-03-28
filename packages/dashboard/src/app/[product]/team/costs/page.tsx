"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissHorizontalBar } from "@/components/charts/swiss-bar-chart";

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

  const { data: byModel, isLoading: modelLoading } = useQuery({
    queryKey: ["team-cost-model", product.id, period],
    queryFn: () => api.getTeamCostByModel(product.id, period),
  });

  const { data: byTaskType, isLoading: taskTypeLoading } = useQuery({
    queryKey: ["team-cost-task-type", product.id, period],
    queryFn: () => api.getTeamCostByTaskType(product.id, period),
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <PageHeader title="Cost Center" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <p className="text-small text-gray-500 mb-3">
        Cost data available for gateway-captured activity only.
      </p>

      {costStats?.dailyExceeded && (
        <div className="border border-warning bg-warning/10 p-2 mb-3">
          <p className="text-body text-warning font-medium">
            Daily cost threshold exceeded — avg ${costStats.avgPerDay.toFixed(2)}/day exceeds ${costStats.costAlertDaily?.toFixed(2)}/day limit
          </p>
        </div>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : costStats ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatCard
            title="Product Total"
            value={`$${costStats.productTotal.toFixed(2)}`}
          />
          <StatCard
            title="Avg / Day"
            value={`$${costStats.avgPerDay.toFixed(2)}`}
          />
          <StatCard
            title="Avg / Engineer"
            value={`$${costStats.avgPerEngineer.toFixed(2)}`}
          />
        </div>
      ) : null}

      <div className="border border-gray-200 p-3 mb-3">
        <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
          Cost Trend
        </h3>
        {trendLoading ? (
          <Skeleton className="h-75" />
        ) : costTrend?.length ? (
          <SwissAreaChart
            data={costTrend}
            xKey="date"
            dataKey="cost"
            label="Cost (USD)"
            thresholdValue={costStats?.costAlertDaily ?? undefined}
            tooltipFormatter={(value) => `$${value.toFixed(2)}`}
          />
        ) : (
          <p className="text-small text-gray-500 py-8 text-center">
            No cost data for this period.
          </p>
        )}
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-6 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            By Engineer
          </h3>
          {engineerLoading ? (
            <Skeleton className="h-50" />
          ) : byEngineer?.length ? (
            <div className="flex flex-col gap-2">
              {byEngineer.map((e) => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="text-small text-gray-700 w-24 text-right truncate">
                    {e.name}
                  </span>
                  <div className="flex-1 h-5 bg-gray-50">
                    <div
                      className="h-full"
                      style={{
                        width: `${(e.cost / Math.max(...byEngineer.map((x) => x.cost), 1)) * 100}%`,
                        backgroundColor: e.exceeded ? "#CC1B1B" : "#0047FF",
                      }}
                    />
                  </div>
                  <span className="text-small tabular-nums text-gray-700 w-16 text-right">
                    ${e.cost.toFixed(2)}
                  </span>
                  {e.exceeded && (
                    <span className="text-label text-danger uppercase tracking-[0.06em]">!</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-small text-gray-500 py-4 text-center">
              No engineer cost data.
            </p>
          )}
        </div>

        <div className="col-span-6 border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            By Model
          </h3>
          {modelLoading ? (
            <Skeleton className="h-50" />
          ) : byModel?.length ? (
            <SwissHorizontalBar
              items={byModel.map((m) => ({ label: m.model, value: m.count }))}
            />
          ) : (
            <p className="text-small text-gray-500 py-4 text-center">
              No model data.
            </p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 p-3">
        <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
          By Task Type
        </h3>
        {taskTypeLoading ? (
          <Skeleton className="h-50" />
        ) : byTaskType?.length ? (
          <SwissHorizontalBar
            items={byTaskType.map((t) => ({
              label: t.taskType,
              value: t.count,
            }))}
          />
        ) : (
          <p className="text-small text-gray-500 py-4 text-center">
            No task type data.
          </p>
        )}
      </div>
    </div>
  );
}
