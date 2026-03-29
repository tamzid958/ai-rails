"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightBlock, InsightCallout } from "@/components/ui/insight-block";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { SwissStackedAreaChart, CHART_COLORS } from "@/components/charts/swiss-line-chart";
import { InsightsCard } from "@/components/recommendations/insights-card";
import { RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";

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

  // Compute business-relevant insights from existing data
  const teamInsights = useMemo(() => {
    if (!overview || !coverage) return null;

    const adoptionRate = overview.totalMembers > 0
      ? Math.round((overview.activeEngineers / overview.totalMembers) * 100)
      : 0;

    const dataQuality = coverage.total > 0
      ? Math.round(((coverage.FULL + coverage.TAGGED) / coverage.total) * 100)
      : 0;

    const costPerActivity = overview.totalActivities > 0
      ? overview.monthlyCost / overview.totalActivities
      : 0;

    return { adoptionRate, dataQuality, costPerActivity };
  }, [overview, coverage]);

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

      {/* Business-relevant callout */}
      {teamInsights && teamInsights.adoptionRate < 60 && (
        <InsightCallout icon={<AlertTriangle size={14} />} variant="warning">
          Only {teamInsights.adoptionRate}% of engineers are actively using AI tools — {overview?.totalMembers ? overview.totalMembers - (overview?.activeEngineers ?? 0) : 0} engineers haven&apos;t started
        </InsightCallout>
      )}
      {teamInsights && teamInsights.adoptionRate >= 80 && (
        <InsightCallout icon={<TrendingUp size={14} />} variant="success">
          {teamInsights.adoptionRate}% adoption — your team is one of the most AI-active
        </InsightCallout>
      )}

      {/* Key business metrics — answers questions donuts couldn't */}
      {teamInsights && (
        <InsightBlock
          items={[
            {
              label: "Team adoption rate",
              value: `${teamInsights.adoptionRate}%`,
              detail: `${overview?.activeEngineers ?? 0} of ${overview?.totalMembers ?? 0} engineers active`,
              sentiment: teamInsights.adoptionRate >= 70 ? "positive" : teamInsights.adoptionRate < 40 ? "negative" : "neutral",
            },
            {
              label: "Data quality score",
              value: `${teamInsights.dataQuality}%`,
              detail: "activities with verified data (Gateway + Tagged)",
              sentiment: teamInsights.dataQuality >= 60 ? "positive" : teamInsights.dataQuality < 30 ? "negative" : "neutral",
            },
            {
              label: "Cost per activity",
              value: `$${teamInsights.costPerActivity.toFixed(4)}`,
              detail: "gateway-captured sessions",
            },
          ]}
        />
      )}

      <InsightsCard />

      {/* Team Activity Trend — answers: "Is the team adopting AI more over time?" */}
      <ChartCard
        title="Team Activity Trend"
        description="Daily sessions by capture method — growing gateway share means richer data and better insights"
      >
        {timelineLoading ? <Skeleton className="h-75" /> : timeline?.length ? (
          <SwissStackedAreaChart
            data={timeline}
            xKey="date"
            series={[
              { dataKey: "GATEWAY", label: "Gateway", color: CHART_COLORS[0] },
              { dataKey: "COMMIT_TAG", label: "Commit Tag", color: CHART_COLORS[1] },
              { dataKey: "HEURISTIC", label: "Heuristic", color: CHART_COLORS[2] },
            ]}
            tooltipFormatter={(v, name) => `${name}: ${v} session${v !== 1 ? "s" : ""}`}
          />
        ) : (
          <EmptyState title="No activity data" description="No team activity recorded for this period." compact />
        )}
      </ChartCard>

      {/* Data Coverage — kept but reframed as "confidence in your data" */}
      <ChartCard
        title="Data Confidence"
        description="How much of your team's AI activity has verified, high-quality data"
      >
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
            <div className="flex flex-wrap gap-4 mt-3">
              {(["FULL", "TAGGED", "HEURISTIC", "NONE"] as const).map((level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COVERAGE_COLORS[level] }}
                  />
                  <span className="text-xs text-text-tertiary">{level}</span>
                  <span className="text-xs tabular-nums text-text-muted">{coverage[level]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No coverage data" compact />
        )}
      </ChartCard>
    </div>
  );
}
