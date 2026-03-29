"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";
import { ChartCard } from "@/components/ui/chart-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { GitBranch } from "lucide-react";

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Repositories" />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !repos?.length ? (
        <EmptyState
          title="No repositories"
          description="No repositories are linked to this product yet."
          icon={<GitBranch size={32} />}
        />
      ) : (
        <ChartCard
          title={`${repos.length} Repositor${repos.length !== 1 ? "ies" : "y"}`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repo</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Activities</TableHead>
                <TableHead className="text-right">PRs</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead className="text-right">Last Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell mono>{repo.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{repo.provider}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums" mono>
                    {repo.activityCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" mono>
                    {repo.prCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={WEBHOOK_VARIANT[repo.webhookStatus]}>
                      {repo.webhookStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {repo.lastEventAt ? (
                      <Tooltip content={format(new Date(repo.lastEventAt), "PPpp")} side="left">
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(new Date(repo.lastEventAt), { addSuffix: true })}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      )}
    </div>
  );
}
