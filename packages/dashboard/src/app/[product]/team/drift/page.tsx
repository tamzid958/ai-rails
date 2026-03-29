"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { ChartCard } from "@/components/ui/chart-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert } from "lucide-react";

const DRIFT_VARIANT = { NONE: "success", LOW: "default", MEDIUM: "warning", HIGH: "error" } as const;

type DriftRow = {
  id: string;
  name: string;
  driftScore: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  modelDrift: string[];
  templateDrift: string[];
  hasGateway: boolean;
  hasTagging: boolean;
  overrideCount: number;
  totalBases: number;
  lastSync: string | null;
  toolsSynced: string[];
  details: string[];
};

function SummaryPill({ icon: Icon, label, className }: { icon: typeof CheckCircle; label: string; className?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5">
      <Icon size={12} strokeWidth={1.5} className={className} />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

export default function ConfigDriftPage() {
  const { product } = useProduct();
  const queryClient = useQueryClient();
  const [viewRow, setViewRow] = useState<DriftRow | null>(null);

  const { data: drift, isLoading, isFetching } = useQuery({
    queryKey: ["team-drift", product.id],
    queryFn: () => api.getTeamDrift(product.id),
  });

  const total = drift?.length ?? 0;
  const highCount = drift?.filter((r) => r.driftScore === "HIGH").length ?? 0;
  const medCount = drift?.filter((r) => r.driftScore === "MEDIUM").length ?? 0;
  const aligned = drift?.filter((r) => r.driftScore === "NONE").length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Config Drift"
        description="Monitor configuration alignment across your team"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["team-drift", product.id] })}
            loading={isFetching && !isLoading}
          >
            <RefreshCw size={12} strokeWidth={1.5} /> Recalculate
          </Button>
        }
      />

      {/* Summary pills */}
      {!isLoading && drift && (
        <div className="flex flex-wrap gap-2">
          <SummaryPill icon={CheckCircle} label={`${aligned}/${total} aligned`} className="text-emerald-400" />
          {highCount > 0 && (
            <SummaryPill icon={AlertTriangle} label={`${highCount} high drift`} className="text-red-400" />
          )}
          {medCount > 0 && (
            <SummaryPill icon={AlertTriangle} label={`${medCount} medium`} className="text-amber-400" />
          )}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : total === 0 ? (
        <EmptyState
          title="No team members"
          description="Add engineers to this product to start tracking configuration drift."
          icon={<ShieldAlert size={32} />}
        />
      ) : (
        <ChartCard title={`${total} Engineer${total !== 1 ? "s" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engineer</TableHead>
                <TableHead>Drift</TableHead>
                <TableHead>Models</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead className="text-center">Gateway</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="w-12">{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(drift as DriftRow[]).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={row.name} size="sm" />
                      <span className="text-text-secondary text-xs">{row.name}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={DRIFT_VARIANT[row.driftScore]}>{row.driftScore}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.modelDrift.length > 0 ? (
                      <Tooltip content={row.modelDrift.join(", ")}>
                        <span className="text-xs text-red-400 cursor-default">
                          {row.modelDrift.length} issue{row.modelDrift.length > 1 ? "s" : ""}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-emerald-400">OK</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.templateDrift.length > 0 ? (
                      <Tooltip content={row.templateDrift.join(", ")}>
                        <span className="text-xs text-amber-400 cursor-default">
                          {row.templateDrift.length} stale
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-text-muted">{row.overrideCount}/{row.totalBases}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Tooltip content={row.hasGateway ? "Gateway active" : "No gateway data"}>
                        {row.hasGateway ? (
                          <Wifi size={14} strokeWidth={1.5} className="text-emerald-400" />
                        ) : (
                          <WifiOff size={14} strokeWidth={1.5} className="text-text-muted" />
                        )}
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.lastSync ? (
                      <Tooltip content={format(new Date(row.lastSync), "PPpp")} side="left">
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(new Date(row.lastSync), { addSuffix: true })}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.details.length > 0 && (
                      <button
                        onClick={() => setViewRow(row)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                      >
                        <Eye size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      )}

      {/* Detail Dialog */}
      <Dialog open={viewRow !== null} onOpenChange={(o) => { if (!o) setViewRow(null); }}>
        {viewRow && (
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>
                <span className="inline-flex items-center gap-3">
                  <Avatar name={viewRow.name} size="sm" />
                  {viewRow.name}
                </span>
              </DialogTitle>
              <DialogDescription>
                <Badge variant={DRIFT_VARIANT[viewRow.driftScore]}>{viewRow.driftScore}</Badge>
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              {/* Issue details */}
              {viewRow.details.map((d, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5"
                >
                  <AlertTriangle size={13} strokeWidth={1.5} className="text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-text-secondary leading-relaxed">{d}</span>
                </div>
              ))}

              {/* Non-allowed models */}
              {viewRow.modelDrift.length > 0 && (
                <div>
                  <p className="text-[11px] text-text-muted mb-2">Non-allowed models used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewRow.modelDrift.map((m) => (
                      <code key={m} className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-red-400">
                        {m}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Stale templates */}
              {viewRow.templateDrift.length > 0 && (
                <div>
                  <p className="text-[11px] text-text-muted mb-2">Stale template overrides</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewRow.templateDrift.map((t) => (
                      <code key={t} className="rounded bg-surface px-2 py-0.5 font-mono text-xs text-amber-400">
                        {t}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Capture methods */}
              <div>
                <p className="text-[11px] text-text-muted mb-2">Capture methods</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    {viewRow.hasGateway ? (
                      <Wifi size={12} className="text-emerald-400" />
                    ) : (
                      <WifiOff size={12} className="text-text-muted" />
                    )}
                    <span className="text-xs text-text-secondary">
                      Gateway {viewRow.hasGateway ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {viewRow.hasTagging ? (
                      <CheckCircle size={12} className="text-emerald-400" />
                    ) : (
                      <WifiOff size={12} className="text-text-muted" />
                    )}
                    <span className="text-xs text-text-secondary">
                      Tagging {viewRow.hasTagging ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
