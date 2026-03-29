"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

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

export default function ConfigDriftPage() {
  const { product } = useProduct();
  const queryClient = useQueryClient();
  const [viewRow, setViewRow] = useState<DriftRow | null>(null);

  const { data: drift, isLoading, isFetching } = useQuery({
    queryKey: ["team-drift", product.id],
    queryFn: () => api.getTeamDrift(product.id),
  });

  // Summary counts
  const total = drift?.length ?? 0;
  const highCount = drift?.filter((r) => r.driftScore === "HIGH").length ?? 0;
  const medCount = drift?.filter((r) => r.driftScore === "MEDIUM").length ?? 0;
  const aligned = drift?.filter((r) => r.driftScore === "NONE").length ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Config Drift"
        description="Monitor configuration alignment across your team"
        actions={
          <Button size="sm" variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["team-drift", product.id] })} loading={isFetching && !isLoading}>
            <RefreshCw size={12} strokeWidth={1.5} /> Recalculate
          </Button>
        }
      />

      {/* Summary */}
      {!isLoading && drift && (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
            <CheckCircle size={12} strokeWidth={1.5} className="text-success" />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{aligned}/{total} aligned</span>
          </div>
          {highCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
              <AlertTriangle size={12} strokeWidth={1.5} className="text-danger" />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{highCount} high drift</span>
            </div>
          )}
          {medCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
              <AlertTriangle size={12} strokeWidth={1.5} className="text-warning" />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{medCount} medium</span>
            </div>
          )}
        </div>
      )}

      {isLoading ? <Skeleton className="h-48" /> : (
        <ChartCard title="Engineers">
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
              {(drift as DriftRow[] | undefined)?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Badge variant={DRIFT_VARIANT[row.driftScore]}>{row.driftScore}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.modelDrift.length > 0 ? (
                      <span className="text-xs text-danger">{row.modelDrift.length} issue{row.modelDrift.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs text-success">OK</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.templateDrift.length > 0 ? (
                      <span className="text-xs text-warning">{row.templateDrift.length} stale</span>
                    ) : (
                      <span className="text-xs text-text-muted">{row.overrideCount}/{row.totalBases}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {row.hasGateway ? (
                        <Wifi size={14} strokeWidth={1.5} className="text-success" />
                      ) : (
                        <WifiOff size={14} strokeWidth={1.5} className="text-text-muted" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.lastSync ? formatDistanceToNow(new Date(row.lastSync), { addSuffix: true }) : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {row.details.length > 0 && (
                      <button onClick={() => setViewRow(row)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer">
                        <Eye size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {drift?.length === 0 && (
                <TableRow><TableCell className="text-center text-text-tertiary py-8">No team members found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ChartCard>
      )}

      {/* Detail Dialog */}
      <Dialog open={viewRow !== null} onOpenChange={(o) => { if (!o) setViewRow(null); }}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{viewRow?.name}</DialogTitle>
            <DialogDescription>
              <Badge variant={DRIFT_VARIANT[viewRow?.driftScore ?? "NONE"]}>{viewRow?.driftScore}</Badge>
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {viewRow?.details.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
                <AlertTriangle size={13} strokeWidth={1.5} style={{ color: "var(--color-warning)", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{d}</span>
              </div>
            ))}

            {viewRow && viewRow.modelDrift.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Non-allowed models used</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewRow.modelDrift.map((m) => (
                    <code key={m} style={{ padding: "3px 8px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-danger)", background: "var(--color-surface)", borderRadius: 4 }}>{m}</code>
                  ))}
                </div>
              </div>
            )}

            {viewRow && viewRow.templateDrift.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Stale template overrides</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewRow.templateDrift.map((t) => (
                    <code key={t} style={{ padding: "3px 8px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-warning)", background: "var(--color-surface)", borderRadius: 4 }}>{t}</code>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Capture methods</p>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {viewRow?.hasGateway ? <Wifi size={12} className="text-success" /> : <WifiOff size={12} className="text-text-muted" />}
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Gateway {viewRow?.hasGateway ? "active" : "inactive"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {viewRow?.hasTagging ? <CheckCircle size={12} className="text-success" /> : <WifiOff size={12} className="text-text-muted" />}
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Tagging {viewRow?.hasTagging ? "active" : "inactive"}</span>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
