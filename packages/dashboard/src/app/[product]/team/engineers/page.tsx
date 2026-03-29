"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period, type TeamEngineersResponse } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { PeriodSelector } from "@/components/engineer/period-selector";
import { ChartCard } from "@/components/ui/chart-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type SortKey = "name" | "activities" | "acceptanceRate" | "cost";

const ROLE_VARIANT = {
  OWNER: "info",
  LEAD: "success",
  MEMBER: "default",
} as const;

export default function TeamEngineersPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("activities");
  const [sortAsc, setSortAsc] = useState(false);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["team-engineers", product.id, period, page, pageSize, sortKey, sortAsc],
    queryFn: () =>
      api.getTeamEngineers(product.id, period, {
        page,
        pageSize,
        sortBy: sortKey,
        sortOrder: sortAsc ? "asc" : "desc",
      }),
    placeholderData: (prev) => prev,
  });

  const engineers = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Engineer Comparison" />
        <PeriodSelector value={period} onChange={(v) => { setPeriod(v); setPage(0); }} />
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-48" />
      ) : (
        <ChartCard title={`Team Members (${total})`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => handleSort("name")} className="cursor-pointer">
                    Engineer{sortIndicator("name")}
                  </button>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <button onClick={() => handleSort("activities")} className="cursor-pointer">
                    Activities{sortIndicator("activities")}
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("acceptanceRate")} className="cursor-pointer">
                    Acceptance{sortIndicator("acceptanceRate")}
                  </button>
                </TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>
                  <button onClick={() => handleSort("cost")} className="cursor-pointer">
                    Cost{sortIndicator("cost")}
                  </button>
                </TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engineers.map((eng) => (
                <TableRow key={eng.id}>
                  <TableCell>
                    <a
                      href={`/${product.slug}/team/engineers?engineerId=${eng.id}`}
                      className="text-accent hover:underline"
                    >
                      {eng.name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[eng.role]}>
                      {eng.role}
                    </Badge>
                  </TableCell>
                  <TableCell mono>{eng.activities}</TableCell>
                  <TableCell mono>
                    {eng.acceptanceRate != null ? `${eng.acceptanceRate}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {eng.tools.length > 0 ? eng.tools.join(", ") : "—"}
                  </TableCell>
                  <TableCell mono>
                    {eng.cost != null ? `$${eng.cost.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <RichnessBadge richness={eng.dataRichness} />
                  </TableCell>
                </TableRow>
              ))}
              {engineers.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-text-tertiary py-8" mono={false}>
                    No team members found.
                  </TableCell>
                </TableRow>
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
        </ChartCard>
      )}
    </div>
  );
}
