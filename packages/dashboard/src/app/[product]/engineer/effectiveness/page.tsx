"use client";

import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SwissLineChart } from "@/components/charts/swiss-line-chart";
import {
  SwissGroupedBar,
  SwissComparisonBar,
} from "@/components/charts/swiss-bar-chart";

export default function EffectivenessPage() {
  const { product, engineer } = useProduct();

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
        <PageHeader title="Effectiveness" />
        <div className="border border-gray-200 p-4 mt-3 text-center">
          <h3 className="text-h3">
            Not enough data yet for {product.name}.
          </h3>
          <p className="text-body text-gray-500 mt-1">
            At least 5 AI-correlated PRs are needed to calculate effectiveness
            scores.
          </p>
          <p className="text-h2 tabular-nums mt-2">
            {effectiveness.totalPrs}/5 PRs correlated
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Effectiveness" />

      {/* Stat Cards */}
      {effectivenessLoading ? (
        <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : effectiveness ? (
        <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
          <StatCard
            title="Acceptance Rate"
            value={`${effectiveness.acceptanceRate.toFixed(1)}%`}
          />
          <StatCard
            title="Revision Rate"
            value={`${effectiveness.revisionRate.toFixed(1)}%`}
          />
          <StatCard
            title="Rejection Rate"
            value={`${effectiveness.rejectionRate.toFixed(1)}%`}
          />
        </div>
      ) : null}

      {/* Acceptance Trend */}
      <div className="border border-gray-200 p-3 mb-3">
        <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
          Acceptance Trend
        </h3>
        {trendLoading ? (
          <Skeleton className="h-75" />
        ) : trend?.length ? (
          <SwissLineChart
            data={trend}
            xKey="week"
            series={[{ dataKey: "rate", label: "Acceptance %" }]}
            tooltipFormatter={(value) => `${value.toFixed(1)}%`}
          />
        ) : (
          <p className="text-small text-gray-500 py-8 text-center">
            No trend data yet.
          </p>
        )}
      </div>

      {/* Tool Effectiveness + Team Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            By Tool
          </h3>
          {toolsLoading ? (
            <Skeleton className="h-50" />
          ) : toolEffectiveness?.length ? (
            <SwissGroupedBar
              items={toolEffectiveness.map((t) => ({
                label: t.tool,
                segments: [
                  { label: "Accepted", value: t.accepted, color: "#1A8C3A" },
                  { label: "Revised", value: t.revised, color: "#C67600" },
                  { label: "Rejected", value: t.rejected, color: "#CC1B1B" },
                ],
              }))}
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No tool data.
            </p>
          )}
        </div>

        <div className="border border-gray-200 p-3">
          <h3 className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
            You vs Team Average
          </h3>
          {comparisonLoading ? (
            <Skeleton className="h-50" />
          ) : comparison ? (
            <SwissComparisonBar
              items={[
                {
                  label: "Acceptance",
                  myValue: comparison.myAcceptance,
                  teamValue: comparison.teamAcceptance,
                },
                {
                  label: "Revision",
                  myValue: comparison.myRevision,
                  teamValue: comparison.teamRevision,
                },
                {
                  label: "Rejection",
                  myValue: comparison.myRejection,
                  teamValue: comparison.teamRejection,
                },
              ]}
            />
          ) : (
            <p className="text-small text-gray-500 py-8 text-center">
              No comparison data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
