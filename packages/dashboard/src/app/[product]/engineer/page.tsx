"use client";

import { useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api, type Period } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { TaggingBanner } from "@/components/engineer/tagging-banner";
import { SwissAreaChart } from "@/components/charts/swiss-line-chart";
import { SwissHorizontalBar } from "@/components/charts/swiss-bar-chart";
import { SuggestionsCard } from "@/components/recommendations/suggestions-card";

const CAPTURE_BADGE_VARIANT = {
  GATEWAY: "accent",
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

  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["engineer-activities", product.id],
    queryFn: ({ pageParam }) => api.getActivities(product.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
  });

  const activities = activitiesData?.pages.flatMap((p) => p.items) ?? [];
  const totalActivities = activitiesData?.pages[0]?.total ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-end justify-between mb-6">
        <PageHeader title="Overview" className="mb-0 pb-0" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <TaggingBanner />

      {/* Stat Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-30" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
          <StatCard
            title="AI-Assisted PRs"
            value={stats.aiAssistedPrs}
            trend={{ value: stats.aiAssistedPrsTrend, label: "vs prev" }}
          />
          <StatCard
            title="Acceptance Rate"
            value={`${stats.acceptanceRate.toFixed(1)}%`}
            trend={{ value: stats.acceptanceRateTrend, label: "vs prev" }}
          />
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            trend={{ value: stats.totalSessionsTrend, label: "vs prev" }}
          />
          <StatCard
            title="Active Days"
            value={stats.activeDays}
            trend={{ value: stats.activeDaysTrend, label: "vs prev" }}
          />
        </div>
      ) : null}

      {/* Suggestions */}
      <div className="mb-6">
        <SuggestionsCard />
      </div>

      {/* Timeline + Tool Distribution */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-12 lg:col-span-8 card p-5">
          <h3 className="text-label uppercase text-gray-400 tracking-[0.08em] mb-4">
            Activity Timeline
          </h3>
          {timelineLoading ? (
            <Skeleton className="h-75" />
          ) : timeline?.length ? (
            <SwissAreaChart
              data={timeline}
              xKey="date"
              dataKey="count"
              label="Activities"
            />
          ) : (
            <p className="text-small text-gray-400 py-12 text-center">
              No activity data for this period.
            </p>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 card p-5">
          <h3 className="text-label uppercase text-gray-400 tracking-[0.08em] mb-4">
            Tool Distribution
          </h3>
          {toolsLoading ? (
            <Skeleton className="h-75" />
          ) : tools?.length ? (
            <SwissHorizontalBar
              items={tools.map((t) => ({ label: t.tool, value: t.count }))}
            />
          ) : (
            <p className="text-small text-gray-400 py-12 text-center">
              No tool data.
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-label uppercase text-gray-400 tracking-[0.08em]">
            Recent Activity
          </h3>
          {totalActivities > 0 && (
            <span className="text-label text-gray-300 tabular-nums">
              {totalActivities} total
            </span>
          )}
        </div>
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
                <TableCell mono>
                  {formatDistanceToNow(new Date(a.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <span
                    className="flex items-center gap-1"
                    title={
                      a.captureMethod === "HEURISTIC"
                        ? `Confidence: ${(a.confidence * 100).toFixed(0)}% — detected via code pattern analysis`
                        : undefined
                    }
                  >
                    <Badge variant={CAPTURE_BADGE_VARIANT[a.captureMethod]}>
                      {a.captureMethod}
                    </Badge>
                    {a.captureMethod === "HEURISTIC" && (
                      <Badge variant="warning">EST</Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>{a.tool ?? "—"}</TableCell>
                <TableCell mono>{a.branchName ?? "—"}</TableCell>
                <TableCell>
                  <RichnessBadge richness={a.dataRichness} />
                </TableCell>
              </TableRow>
            ))}
            {activities.length === 0 && (
              <TableRow>
                <TableCell className="text-center text-gray-400 py-8" mono={false}>
                  No recent activity.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {hasNextPage && (
          <div className="mt-4 text-center">
            <Button
              variant="secondary"
              size="sm"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load more
            </Button>
          </div>
        )}
        {activities.some((a) => a.captureMethod === "HEURISTIC") && (
          <p className="text-label text-gray-300 mt-4">
            Includes estimated data — heuristic records are detected via code
            pattern analysis and may not reflect confirmed AI usage.
          </p>
        )}
      </div>
    </div>
  );
}
