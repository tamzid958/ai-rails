"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { SwissLineChart } from "@/components/charts/swiss-line-chart";
import { SwissGroupedBar, SwissComparisonBar } from "@/components/charts/swiss-bar-chart";
import { Target, RefreshCw } from "lucide-react";

export default function EffectivenessPage() {
  const { product, engineer } = useProduct();
  const queryClient = useQueryClient();

  const recalcMutation = useMutation({
    mutationFn: () => api.triggerJob(product.id, "recalculate-effectiveness"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineer-effectiveness"] });
      queryClient.invalidateQueries({ queryKey: ["engineer-effectiveness-trend"] });
      queryClient.invalidateQueries({ queryKey: ["engineer-tool-effectiveness"] });
      queryClient.invalidateQueries({ queryKey: ["engineer-team-comparison"] });
    },
  });

  const { data: effectiveness, isLoading: effectivenessLoading } = useQuery({
    queryKey: ["engineer-effectiveness", product.id, engineer.id],
    queryFn: () => api.getEffectiveness(product.id, engineer.id),
  });

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ["engineer-effectiveness-trend", product.id, engineer.id],
    queryFn: () => api.getEffectivenessTrend(product.id, engineer.id),
    enabled: effectiveness?.sufficient !== false,
  });

  const { data: toolEffectiveness, isLoading: toolsLoading } = useQuery({
    queryKey: ["engineer-tool-effectiveness", product.id, engineer.id],
    queryFn: () => api.getToolEffectiveness(product.id, engineer.id),
    enabled: effectiveness?.sufficient !== false,
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ["engineer-team-comparison", product.id, engineer.id],
    queryFn: () => api.getTeamComparison(product.id, engineer.id),
    enabled: effectiveness?.sufficient !== false,
  });

  if (!effectivenessLoading && effectiveness && !effectiveness.sufficient) {
    return (
      <div>
        <PageHeader
          title="Effectiveness"
          actions={
            <Button size="sm" variant="secondary" onClick={() => recalcMutation.mutate()} loading={recalcMutation.isPending}>
              <RefreshCw size={12} strokeWidth={1.5} /> Recalculate
            </Button>
          }
        />
        <div className="bg-surface-raised border border-border-subtle rounded-lg p-8 text-center">
          <Target size={28} strokeWidth={1} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-medium text-text-primary">Not enough data yet</h3>
          <p className="text-sm text-text-tertiary mt-1">
            At least 5 AI-correlated PRs are needed to calculate effectiveness scores.
          </p>
          <p className="text-3xl font-light tabular-nums text-text-primary mt-4">
            {effectiveness.totalPrs}/5
          </p>
          <p className="text-xs text-text-muted mt-1">PRs correlated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Effectiveness"
        actions={
          <Button size="sm" variant="secondary" onClick={() => recalcMutation.mutate()} loading={recalcMutation.isPending}>
            <RefreshCw size={12} strokeWidth={1.5} /> Recalculate
          </Button>
        }
      />

      {effectivenessLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : effectiveness ? (
        <div className="grid grid-cols-3 gap-4 stagger">
          <StatCard title="Acceptance Rate" value={`${effectiveness.acceptanceRate.toFixed(1)}%`} />
          <StatCard title="Revision Rate" value={`${effectiveness.revisionRate.toFixed(1)}%`} />
          <StatCard title="Rejection Rate" value={`${effectiveness.rejectionRate.toFixed(1)}%`} />
        </div>
      ) : null}

      <ChartCard
        title="Acceptance Trend"
        description="Weekly first-pass acceptance rate — are your AI-assisted PRs improving over time?"
      >
        {trendLoading ? <Skeleton className="h-75" /> : trend?.length ? (
          <SwissLineChart
            data={trend}
            xKey="week"
            series={[{ dataKey: "rate", label: "Acceptance %" }]}
            tooltipFormatter={(v) => `${v.toFixed(1)}%`}
            yAxisFormatter={(v) => `${v}%`}
          />
        ) : (
          <EmptyState title="No trend data" description="Trend data appears after multiple weeks of activity." compact />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Effectiveness by Tool"
          description="How each AI tool impacts PR outcomes — find your best-performing tools"
          className="h-full"
        >
          {toolsLoading ? <Skeleton className="h-50" /> : toolEffectiveness?.length ? (
            <SwissGroupedBar
              items={toolEffectiveness.map((t) => ({
                label: t.tool,
                segments: [
                  { label: "Accepted", value: t.accepted, color: "var(--color-success)" },
                  { label: "Revised", value: t.revised, color: "var(--color-warning)" },
                  { label: "Rejected", value: t.rejected, color: "var(--color-danger)" },
                ],
              }))}
            />
          ) : (
            <EmptyState title="No tool data" compact />
          )}
        </ChartCard>

        <ChartCard
          title="You vs Team Average"
          description="How your PR outcomes compare — below team rejection rate is a positive signal"
          className="h-full"
        >
          {comparisonLoading ? <Skeleton className="h-50" /> : comparison ? (
            <SwissComparisonBar
              items={[
                { label: "Acceptance", myValue: comparison.myAcceptance, teamValue: comparison.teamAcceptance },
                { label: "Revision", myValue: comparison.myRevision, teamValue: comparison.teamRevision },
                { label: "Rejection", myValue: comparison.myRejection, teamValue: comparison.teamRejection },
              ]}
            />
          ) : (
            <EmptyState title="No comparison data" compact />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
