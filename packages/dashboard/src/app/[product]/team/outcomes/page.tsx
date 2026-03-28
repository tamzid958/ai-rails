"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Select } from "@/components/ui/select";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "info" | "success" | "warning" | "error" | "outline" | "purple" | "cyan"> = {
  OPENED: "info",
  REVIEW_IN_PROGRESS: "cyan",
  CHANGES_REQUESTED: "warning",
  APPROVED: "purple",
  MERGED: "success",
  CLOSED: "default",
  REVERTED: "error",
};

export default function TeamOutcomesPage() {
  const { product } = useProduct();
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: Record<string, string> = {};
  const status = searchParams.get("status");
  const engineerId = searchParams.get("engineerId");
  const repo = searchParams.get("repo");
  const richness = searchParams.get("richness");
  if (status) filters.status = status;
  if (engineerId) filters.engineerId = engineerId;
  if (repo) filters.repo = repo;
  if (richness) filters.richness = richness;

  const { data, isLoading } = useQuery({
    queryKey: ["team-outcomes", product.id, filters],
    queryFn: () => api.getTeamOutcomes(product.id, filters),
  });

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const [statusFilter, setStatusFilter] = useState(status ?? "");
  const [richnessFilter, setRichnessFilter] = useState(richness ?? "");

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="PR Outcomes" />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : data?.stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard title="Total PRs" value={data.stats.total} />
          <StatCard title="Acceptance Rate" value={`${data.stats.acceptanceRate}%`} />
          <StatCard title="Revision Rate" value={`${data.stats.revisionRate}%`} />
          <StatCard title="Rejection Rate" value={`${data.stats.rejectionRate}%`} />
        </div>
      ) : null}

      <ChartCard
        title="Pull Requests"
        action={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setFilter("status", v === "ALL" ? null : v); }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "OPENED", label: "Opened" },
                { value: "MERGED", label: "Merged" },
                { value: "CHANGES_REQUESTED", label: "Changes Requested" },
                { value: "CLOSED", label: "Closed" },
                { value: "REVERTED", label: "Reverted" },
              ]}
            />
            <Select
              value={richnessFilter || "ALL"}
              onValueChange={(v) => { setRichnessFilter(v === "ALL" ? "" : v); setFilter("richness", v === "ALL" ? null : v); }}
              options={[
                { value: "ALL", label: "All richness" },
                { value: "FULL", label: "Full" },
                { value: "TAGGED", label: "Tagged" },
                { value: "HEURISTIC", label: "Heuristic" },
                { value: "NONE", label: "None" },
              ]}
            />
          </div>
        }
      >
        {isLoading ? <Skeleton className="h-50" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR</TableHead>
                <TableHead>Repo</TableHead>
                <TableHead>Engineer</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Activity</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell mono>#{pr.prNumber}</TableCell>
                  <TableCell mono>{pr.repoFullName}</TableCell>
                  <TableCell>{pr.engineerName}</TableCell>
                  <TableCell mono>{pr.branchName}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[pr.status] ?? "default"}>{pr.status}</Badge></TableCell>
                  <TableCell mono>{pr.aiActivityCount > 0 ? `${pr.aiActivityCount} sessions` : "\u2014"}</TableCell>
                  <TableCell><RichnessBadge richness={pr.dataRichness} /></TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow><TableCell className="text-center text-text-tertiary py-8">No PR outcomes found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ChartCard>
    </div>
  );
}
