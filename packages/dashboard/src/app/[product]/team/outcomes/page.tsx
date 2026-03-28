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
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "info" | "success" | "warning" | "error"> = {
  OPENED: "default",
  REVIEW_IN_PROGRESS: "default",
  CHANGES_REQUESTED: "warning",
  APPROVED: "success",
  MERGED: "info",
  CLOSED: "error",
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
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const [statusFilter, setStatusFilter] = useState(status ?? "");
  const [richnessFilter, setRichnessFilter] = useState(richness ?? "");

  return (
    <div>
      <PageHeader title="PR Outcomes" />

      {isLoading ? (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.stats ? (
        <div className="grid grid-cols-4 gap-3 mb-3">
          <StatCard title="Total PRs" value={data.stats.total} />
          <StatCard
            title="Acceptance Rate"
            value={`${data.stats.acceptanceRate}%`}
          />
          <StatCard
            title="Revision Rate"
            value={`${data.stats.revisionRate}%`}
          />
          <StatCard
            title="Rejection Rate"
            value={`${data.stats.rejectionRate}%`}
          />
        </div>
      ) : null}

      <div className="flex gap-2 mb-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setFilter("status", e.target.value || null);
          }}
          className="border border-gray-200 px-2 py-1 text-small bg-white"
        >
          <option value="">All statuses</option>
          {["OPENED", "MERGED", "CHANGES_REQUESTED", "CLOSED", "REVERTED"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>

        <select
          value={richnessFilter}
          onChange={(e) => {
            setRichnessFilter(e.target.value);
            setFilter("richness", e.target.value || null);
          }}
          className="border border-gray-200 px-2 py-1 text-small bg-white"
        >
          <option value="">All richness</option>
          {["FULL", "TAGGED", "HEURISTIC", "NONE"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
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
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[pr.status] ?? "default"}>
                      {pr.status}
                    </Badge>
                  </TableCell>
                  <TableCell mono>
                    {pr.aiActivityCount > 0
                      ? `${pr.aiActivityCount} sessions`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <RichnessBadge richness={pr.dataRichness} />
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No PR outcomes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
