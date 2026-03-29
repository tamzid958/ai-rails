"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightBlock, InsightCallout } from "@/components/ui/insight-block";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { TaggingBanner } from "@/components/engineer/tagging-banner";
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SuggestionsCard } from "@/components/recommendations/suggestions-card";
import { OnboardingChecklist } from "@/components/engineer/onboarding-checklist";

const CAPTURE_BADGE_VARIANT = {
  GATEWAY: "info",
  COMMIT_TAG: "success",
  HEURISTIC: "warning",
} as const;

export default function EngineerOverviewPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["engineer-stats", product.id, period],
    queryFn: () => api.getStats(product.id, period),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["engineer-timeline", product.id, period],
    queryFn: () => api.getTimeline(product.id, period),
  });

  const { data: tools } = useQuery({
    queryKey: ["engineer-tools", product.id, period],
    queryFn: () => api.getToolDistribution(product.id, period),
  });

  const [activityCursor, setActivityCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [activityPage, setActivityPage] = useState(0);

  const { data: activitiesData } = useQuery({
    queryKey: ["engineer-activities", product.id, activityCursor],
    queryFn: () => api.getActivities(product.id, activityCursor),
    placeholderData: (prev) => prev,
  });

  const activities = activitiesData?.items ?? [];
  const totalActivities = activitiesData?.total ?? 0;
  const hasNextPage = !!activitiesData?.cursor;

  const keyInsights = useMemo(() => {
    if (!stats || !tools) return null;
    const sorted = [...(tools ?? [])].sort((a, b) => b.count - a.count);
    const topTool = sorted[0];
    const totalToolSessions = sorted.reduce((s, t) => s + t.count, 0);
    const topToolPct = topTool && totalToolSessions > 0
      ? Math.round((topTool.count / totalToolSessions) * 100)
      : 0;
    const sessionsPerDay = stats.activeDays > 0
      ? (stats.totalSessions / stats.activeDays).toFixed(1)
      : "0";
    const prYield = stats.totalSessions > 0
      ? ((stats.aiAssistedPrs / stats.totalSessions) * 100).toFixed(0)
      : "0";

    return { topTool, topToolPct, sessionsPerDay, toolCount: sorted.length, prYield };
  }, [stats, tools]);

  function goNext() {
    if (!activitiesData?.cursor) return;
    setCursorHistory((prev) => [...prev, activitiesData.cursor ?? undefined]);
    setActivityCursor(activitiesData.cursor);
    setActivityPage((p) => p + 1);
  }

  function goPrev() {
    if (activityPage === 0) return;
    setActivityCursor(cursorHistory[activityPage - 1]);
    setActivityPage((p) => p - 1);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Overview" className="mb-0 pb-0" />
        <div className="mt-3 sm:mt-0">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <OnboardingChecklist />

      <TaggingBanner />

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard title="AI-Assisted PRs" value={stats.aiAssistedPrs} trend={{ value: stats.aiAssistedPrsTrend, label: "vs prev" }} />
          <StatCard title="Acceptance Rate" value={`${stats.acceptanceRate.toFixed(1)}%`} trend={{ value: stats.acceptanceRateTrend, label: "vs prev" }} />
          <StatCard title="Total Sessions" value={stats.totalSessions} trend={{ value: stats.totalSessionsTrend, label: "vs prev" }} />
          <StatCard title="Active Days" value={stats.activeDays} trend={{ value: stats.activeDaysTrend, label: "vs prev" }} />
        </div>
      ) : null}

      {/* Computed insights */}
      {keyInsights && (
        <InsightBlock
          items={[
            {
              label: "Primary tool",
              value: keyInsights.topTool ? `${keyInsights.topTool.tool} (${keyInsights.topToolPct}%)` : "—",
              detail: keyInsights.toolCount > 1 ? `${keyInsights.toolCount} tools used` : undefined,
            },
            {
              label: "Sessions / active day",
              value: keyInsights.sessionsPerDay,
              detail: `${stats?.activeDays ?? 0} active days`,
            },
            {
              label: "PR yield rate",
              value: `${keyInsights.prYield}%`,
              detail: "sessions that led to a PR",
              sentiment: Number(keyInsights.prYield) >= 30 ? "positive" : "neutral",
            },
          ]}
        />
      )}

      {stats && stats.acceptanceRate >= 70 && (
        <InsightCallout icon={<TrendingUp size={14} />} variant="success">
          {stats.acceptanceRate.toFixed(0)}% of your AI-assisted PRs are accepted first-pass — above the 70% benchmark
        </InsightCallout>
      )}

      <SuggestionsCard />

      {/* Activity Timeline */}
      <ChartCard
        title="Activity Timeline"
        description="Daily AI-assisted sessions — spot productivity patterns and consistency"
      >
        {timelineLoading ? <Skeleton className="h-75" /> : timeline?.length ? (
          <SwissAreaChart
            data={timeline}
            xKey="date"
            dataKey="count"
            label="Sessions"
            tooltipFormatter={(v) => `${v} session${v !== 1 ? "s" : ""}`}
          />
        ) : (
          <EmptyState title="No activity data" description="No activity recorded for this period." compact />
        )}
      </ChartCard>

      {/* Recent Activity */}
      <ChartCard
        title="Recent Activity"
        action={totalActivities > 0 ? <span className="text-xs text-text-muted tabular-nums">{totalActivities} total</span> : undefined}
      >
        {activities.length === 0 ? (
          <EmptyState title="No recent activity" description="Your AI-assisted coding sessions will appear here." compact />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Tooltip content={format(new Date(a.createdAt), "PPpp")}>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Badge variant={CAPTURE_BADGE_VARIANT[a.captureMethod]}>{a.captureMethod}</Badge>
                      {a.captureMethod === "HEURISTIC" && <Badge variant="warning">EST</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>{a.tool ?? "—"}</TableCell>
                  <TableCell mono>{a.branchName ?? "—"}</TableCell>
                  <TableCell><RichnessBadge richness={a.dataRichness} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {(activityPage > 0 || hasNextPage) && (
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={activityPage === 0} onClick={goPrev}>
              <ChevronLeft size={14} strokeWidth={1.5} /> Previous
            </Button>
            <span className="text-xs text-text-muted tabular-nums">Page {activityPage + 1}</span>
            <Button variant="ghost" size="sm" disabled={!hasNextPage} onClick={goNext}>
              Next <ChevronRight size={14} strokeWidth={1.5} />
            </Button>
          </div>
        )}
        {activities.some((a) => a.captureMethod === "HEURISTIC") && (
          <p className="text-xs text-text-muted mt-4">
            Includes estimated data — heuristic records are detected via code pattern analysis and may not reflect confirmed AI usage.
          </p>
        )}
      </ChartCard>
    </div>
  );
}
