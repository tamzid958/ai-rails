"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { TaggingBanner } from "@/components/engineer/tagging-banner";
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissDonutChart } from "@/components/charts/swiss-donut-chart";
import { SuggestionsCard } from "@/components/recommendations/suggestions-card";

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

  const { data: tools, isLoading: toolsLoading } = useQuery({
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

  function goNext() {
    if (!activitiesData?.cursor) return;
    const nextCursor = activitiesData.cursor;
    setCursorHistory((prev) => [...prev, nextCursor]);
    setActivityCursor(nextCursor);
    setActivityPage((p) => p + 1);
  }

  function goPrev() {
    if (activityPage === 0) return;
    const prevCursor = cursorHistory[activityPage - 1];
    setActivityCursor(prevCursor);
    setActivityPage((p) => p - 1);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Overview" className="mb-0 pb-0" />
        <div className="mt-3 sm:mt-0">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <TaggingBanner />

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard title="AI-Assisted PRs" value={stats.aiAssistedPrs} trend={{ value: stats.aiAssistedPrsTrend, label: "vs prev" }} />
          <StatCard title="Acceptance Rate" value={`${stats.acceptanceRate.toFixed(1)}%`} trend={{ value: stats.acceptanceRateTrend, label: "vs prev" }} />
          <StatCard title="Total Sessions" value={stats.totalSessions} trend={{ value: stats.totalSessionsTrend, label: "vs prev" }} />
          <StatCard title="Active Days" value={stats.activeDays} trend={{ value: stats.activeDaysTrend, label: "vs prev" }} />
        </div>
      ) : null}

      <SuggestionsCard />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <ChartCard title="Activity Timeline" className="h-full">
            {timelineLoading ? <Skeleton className="h-75" /> : timeline?.length ? (
              <SwissAreaChart data={timeline} xKey="date" dataKey="count" label="Activities" />
            ) : (
              <p className="text-sm text-text-tertiary text-center py-12">No activity data for this period.</p>
            )}
          </ChartCard>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Tool Distribution" className="h-full">
            {toolsLoading ? <Skeleton className="h-75" /> : tools?.length ? (
              <SwissDonutChart items={tools.map((t) => ({ label: t.tool, value: t.count }))} maxItems={5} />
            ) : (
              <p className="text-sm text-text-tertiary text-center py-12">No tool data.</p>
            )}
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title="Recent Activity"
        action={totalActivities > 0 ? <span className="text-xs text-gray-400 tabular-nums">{totalActivities} total</span> : undefined}
      >
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
                <TableCell mono>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Badge variant={CAPTURE_BADGE_VARIANT[a.captureMethod]}>{a.captureMethod}</Badge>
                    {a.captureMethod === "HEURISTIC" && <Badge variant="warning">EST</Badge>}
                  </span>
                </TableCell>
                <TableCell>{a.tool ?? "\u2014"}</TableCell>
                <TableCell mono>{a.branchName ?? "\u2014"}</TableCell>
                <TableCell><RichnessBadge richness={a.dataRichness} /></TableCell>
              </TableRow>
            ))}
            {activities.length === 0 && (
              <TableRow><TableCell className="text-center text-gray-400 py-8">No recent activity.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
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
          <p className="text-xs text-gray-400 mt-4">
            Includes estimated data — heuristic records are detected via code pattern analysis and may not reflect confirmed AI usage.
          </p>
        )}
      </ChartCard>
    </div>
  );
}
