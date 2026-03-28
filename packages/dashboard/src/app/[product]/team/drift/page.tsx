"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const DRIFT_VARIANT = {
  NONE: "default",
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
} as const;

export default function ConfigDriftPage() {
  const { product } = useProduct();

  const { data: drift, isLoading } = useQuery({
    queryKey: ["team-drift", product.id],
    queryFn: () => api.getTeamDrift(product.id),
  });

  return (
    <div>
      <PageHeader title="Config Drift" />

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engineer</TableHead>
                <TableHead>Overrides</TableHead>
                <TableHead>Drift Score</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Tools Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drift?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell mono>
                    {row.overrideCount}/{row.totalBases}
                  </TableCell>
                  <TableCell>
                    <Badge variant={DRIFT_VARIANT[row.driftScore]}>
                      {row.driftScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.lastSync
                      ? formatDistanceToNow(new Date(row.lastSync), {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.toolsSynced.length > 0
                      ? row.toolsSynced.join(", ")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {drift?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No drift data available.
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
