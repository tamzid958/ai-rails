"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type Period, type TeamEngineerRow } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RichnessBadge } from "@/components/data-richness/richness-badge";
import { PeriodSelector } from "@/components/engineer/period-selector";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type SortKey = keyof Pick<TeamEngineerRow, "name" | "activities" | "acceptanceRate" | "cost">;

const ROLE_VARIANT = {
  OWNER: "accent",
  LEAD: "success",
  MEMBER: "default",
} as const;

export default function TeamEngineersPage() {
  const { product } = useProduct();
  const [period, setPeriod] = useState<Period>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("activities");
  const [sortAsc, setSortAsc] = useState(false);

  const { data: engineers, isLoading } = useQuery({
    queryKey: ["team-engineers", product.id, period],
    queryFn: () => api.getTeamEngineers(product.id, period),
  });

  const sorted = useMemo(() => {
    if (!engineers) return [];
    return [...engineers].sort((a, b) => {
      const aVal = a[sortKey] ?? -1;
      const bVal = b[sortKey] ?? -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [engineers, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortAsc ? " ▲" : " ▼";
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <PageHeader title="Engineer Comparison" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
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
              {sorted.map((eng) => (
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
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-gray-500 py-4" mono={false}>
                    No team members found.
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
