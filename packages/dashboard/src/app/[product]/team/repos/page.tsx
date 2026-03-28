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

const WEBHOOK_VARIANT = {
  CONNECTED: "success",
  STALE: "warning",
  PENDING: "default",
} as const;

export default function TeamReposPage() {
  const { product } = useProduct();

  const { data: repos, isLoading } = useQuery({
    queryKey: ["team-repos", product.id],
    queryFn: () => api.getTeamRepos(product.id),
  });

  return (
    <div>
      <PageHeader title="Repositories" />

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repo</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead>PRs</TableHead>
                <TableHead>Webhook Status</TableHead>
                <TableHead>Last Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos?.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell mono>{repo.fullName}</TableCell>
                  <TableCell>{repo.provider}</TableCell>
                  <TableCell mono>{repo.activityCount}</TableCell>
                  <TableCell mono>{repo.prCount}</TableCell>
                  <TableCell>
                    <Badge variant={WEBHOOK_VARIANT[repo.webhookStatus]}>
                      {repo.webhookStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {repo.lastEventAt
                      ? formatDistanceToNow(new Date(repo.lastEventAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {repos?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No repositories linked to this product.
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
