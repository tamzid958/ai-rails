"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissStackedAreaChart, CHART_COLORS } from "@/components/charts/swiss-line-chart";
import { InsightsCard } from "@/components/recommendations/insights-card";

const COVERAGE_COLORS = {
  FULL: "#0047FF",
  TAGGED: "#1A8C3A",
  HEURISTIC: "#C67600",
  NONE: "#d1d5db",
} as const;

export default function TeamOverviewPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");

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
    <div className="animate-fade-in">
      <div className="flex items-end justify-between mb-6">
        <PageHeader title="Team Overview" className="mb-0 pb-0" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {overviewLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-30" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
          <StatCard
            title="Total Activities"
            value={overview.totalActivities.toLocaleString()}
            trend={{ value: overview.totalActivitiesTrend, label: "vs prev" }}
          />
          <StatCard
            title="Acceptance Rate"
            value={`${overview.acceptanceRate}%`}
            trend={{ value: overview.acceptanceRateTrend, label: "vs prev" }}
          />
          <StatCard
            title="Active Engineers"
            value={`${overview.activeEngineers} / ${overview.totalMembers}`}
          />
          <StatCard
            title="Monthly Cost"
            value={`$${overview.monthlyCost.toFixed(2)}`}
            trend={{ value: overview.monthlyCostTrend, label: "vs prev" }}
          />
        </div>
      ) : null}

      {/* Team Insights */}
      <div className="mb-6">
        <InsightsCard />
      </div>

      <div className="card p-5 mb-6">
        <h3 className="text-label uppercase text-gray-400 tracking-[0.08em] mb-4">
          Team Activity Trend
        </h3>
        {timelineLoading ? (
          <Skeleton className="h-75" />
        ) : timeline?.length ? (
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
          <p className="text-small text-gray-400 py-12 text-center">
            No activity data for this period.
          </p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-label uppercase text-gray-400 tracking-[0.08em] mb-4">
          Data Coverage
        </h3>
        {coverageLoading ? (
          <Skeleton className="h-10" />
        ) : coverage && coverage.total > 0 ? (
          <div>
            <div className="flex h-10 w-full overflow-hidden">
              {(["FULL", "TAGGED", "HEURISTIC", "NONE"] as const).map((level) => {
                const pct = (coverage[level] / coverage.total) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={level}
                    className="h-full flex items-center justify-center text-label uppercase tracking-[0.08em] font-semibold transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COVERAGE_COLORS[level],
                      color: level === "NONE" ? "#575757" : "#fff",
                    }}
                  >
                    {pct >= 8 ? `${Math.round(pct)}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-5 mt-3">
              {(["FULL", "TAGGED", "HEURISTIC", "NONE"] as const).map((level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5"
                    style={{ backgroundColor: COVERAGE_COLORS[level] }}
                  />
                  <span className="text-label uppercase tracking-[0.08em] text-gray-400">
                    {level}
                  </span>
                  <span className="text-label tabular-nums text-gray-300">
                    {coverage[level]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-small text-gray-400 py-8 text-center">
            No coverage data.
          </p>
        )}
      </div>
    </div>
  );
}
