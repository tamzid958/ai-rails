"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissStackedAreaChart, CHART_COLORS } from "@/components/charts/swiss-line-chart";
import { InsightsCard } from "@/components/recommendations/insights-card";
import { RefreshCw } from "lucide-react";

const COVERAGE_COLORS = {
  FULL: "var(--color-chart-1)",
  TAGGED: "var(--color-chart-3)",
  HEURISTIC: "var(--color-chart-4)",
  NONE: "var(--color-gray-600)",
} as const;

export default function TeamOverviewPage() {
  const { product } = useProduct();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("30d");

  const regenMutation = useMutation({
    mutationFn: () => api.triggerJob(product.id, "generate-recommendations"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-recommendations"] }),
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["team-overview", product.id, period],
    queryFn: () => api.getTeamOverview(product.id, period),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["team-timeline", product.id, period],
    queryFn: () => api.getTeamTimeline(product.id, period),
  });

  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["team-coverage", product.id, period],
    queryFn: () => api.getDataCoverage(product.id, period),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageHeader title="Team Overview" className="mb-0 pb-0" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => regenMutation.mutate()} loading={regenMutation.isPending}>
            <RefreshCw size={12} strokeWidth={1.5} /> Regenerate Insights
          </Button>
        <div className="mt-3 sm:mt-0">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>
    </div>
      {overviewLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard title="Total Activities" value={overview.totalActivities.toLocaleString()} trend={{ value: overview.totalActivitiesTrend, label: "vs prev" }} />
          <StatCard title="Acceptance Rate" value={`${overview.acceptanceRate}%`} trend={{ value: overview.acceptanceRateTrend, label: "vs prev" }} />
          <StatCard title="Active Engineers" value={`${overview.activeEngineers} / ${overview.totalMembers}`} />
          <StatCard title="Monthly Cost" value={`$${overview.monthlyCost.toFixed(2)}`} trend={{ value: overview.monthlyCostTrend, label: "vs prev" }} />
        </div>
      ) : null}

      <InsightsCard />

      <ChartCard title="Team Activity Trend">
        {timelineLoading ? <Skeleton className="h-75" /> : timeline?.length ? (
          <SwissStackedAreaChart
            data={timeline}
            xKey="date"
            series={[
              { dataKey: "GATEWAY", label: "Gateway", color: CHART_COLORS[0] },
              { dataKey: "COMMIT_TAG", label: "Commit Tag", color: CHART_COLORS[1] },
              { dataKey: "HEURISTIC", label: "Heuristic", color: CHART_COLORS[2] },
            ]}
          />
        ) : (
          <p className="text-sm text-gray-400 text-center py-12">No activity data for this period.</p>
        )}
      </ChartCard>

      <ChartCard title="Data Coverage">
        {coverageLoading ? <Skeleton className="h-10" /> : coverage && coverage.total > 0 ? (
          <div>
            <div className="flex h-8 w-full overflow-hidden rounded-md">
              {(["FULL", "TAGGED", "HEURISTIC", "NONE"] as const).map((level) => {
                const pct = (coverage[level] / coverage.total) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={level}
                    className="h-full flex items-center justify-center text-[11px] font-medium transition-all"
                    style={{ width: `${pct}%`, backgroundColor: COVERAGE_COLORS[level], color: level === "NONE" ? "var(--color-text-tertiary)" : "#fff" }}
                  >
                    {pct >= 8 ? `${Math.round(pct)}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-5 mt-4">
              {(["FULL", "TAGGED", "HEURISTIC", "NONE"] as const).map((level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COVERAGE_COLORS[level] }} />
                  <span className="text-xs text-text-tertiary">{level}</span>
                  <span className="text-xs tabular-nums text-text-muted">{coverage[level]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary text-center py-8">No coverage data.</p>
        )}
      </ChartCard>
    </div>
  
  );
}
