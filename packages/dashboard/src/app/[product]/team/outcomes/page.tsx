"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Select } from "@/components/ui/select";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

type SortKey = "createdAt" | "prNumber" | "status" | "repoFullName";

export default function TeamOutcomesPage() {
  const { product } = useProduct();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 20;

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
    queryKey: ["team-outcomes", product.id, filters, page, pageSize, sortKey, sortAsc],
    queryFn: () =>
      api.getTeamOutcomes(product.id, {
        ...filters,
        page: String(page),
        pageSize: String(pageSize),
        sortBy: sortKey,
        sortOrder: sortAsc ? "asc" : "desc",
      }),
    placeholderData: (prev) => prev,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      router.push(`?${params.toString()}`);
      setPage(0);
    },
    [searchParams, router],
  );

  const [statusFilter, setStatusFilter] = useState(status ?? "");
  const [richnessFilter, setRichnessFilter] = useState(richness ?? "");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(0);
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? " ▲" : " ▼";
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="PR Outcomes" />

      {isLoading && !data ? (
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
        title={`Pull Requests${total > 0 ? ` (${total})` : ""}`}
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
        {isLoading && !data ? <Skeleton className="h-50" /> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => handleSort("prNumber")} className="cursor-pointer">
                      PR{sortIndicator("prNumber")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("repoFullName")} className="cursor-pointer">
                      Repo{sortIndicator("repoFullName")}
                    </button>
                  </TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("status")} className="cursor-pointer">
                      Status{sortIndicator("status")}
                    </button>
                  </TableHead>
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

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-xs text-text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
}
