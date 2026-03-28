"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useState } from "react";

export default function ProvidersPage() {
  const { product, isOwner, isLead } = useProduct();
  const queryClient = useQueryClient();
  const canManage = isOwner || isLead;

  const [toggleTarget, setToggleTarget] = useState<{ model: string; action: "block" | "unblock" } | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["settings-providers", product.id],
    queryFn: () => api.getProviders(product.id),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-product", product.id],
    queryFn: () => api.getProductSettings(product.id),
    enabled: canManage,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!toggleTarget || !settings) return;
      const current = settings.allowedModels;

      let updated: string[];
      if (toggleTarget.action === "block") {
        // If allowlist is empty (all allowed), create list with all except this one
        if (current.length === 0) {
          updated = providers?.filter((p) => p.model !== toggleTarget.model).map((p) => p.model) ?? [];
        } else {
          updated = current.filter((m) => m !== toggleTarget.model);
        }
      } else {
        // Unblock: add to allowlist, or if adding back makes it full list, clear to empty (all allowed)
        updated = [...current, toggleTarget.model];
        const allModels = providers?.map((p) => p.model) ?? [];
        if (allModels.every((m) => updated.includes(m))) {
          updated = []; // all allowed
        }
      }

      return api.updateProduct(product.id, { ...settings, allowedModels: updated });
    },
    onSuccess: () => {
      setToggleTarget(null);
      queryClient.invalidateQueries({ queryKey: ["settings-providers"] });
      queryClient.invalidateQueries({ queryKey: ["settings-product"] });
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Providers"
        description="Manage which AI models are available for this product."
      />

      {isLoading ? <Skeleton className="h-48" /> : (
        <ChartCard title="AI Models">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-24">{""}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers?.map((p) => (
                <TableRow key={p.model}>
                  <TableCell mono>{p.model}</TableCell>
                  <TableCell>{p.provider}</TableCell>
                  <TableCell>
                    <Badge variant={p.allowed ? "success" : "error"}>
                      {p.allowed ? "Active" : "Blocked"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant={p.allowed ? "ghost" : "secondary"}
                        onClick={() => setToggleTarget({ model: p.model, action: p.allowed ? "block" : "unblock" })}
                      >
                        {p.allowed ? "Block" : "Enable"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {providers?.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-text-tertiary py-8">No providers configured.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ChartCard>
      )}

      <ConfirmDialog
        open={toggleTarget !== null}
        title={toggleTarget?.action === "block" ? "Block Model" : "Enable Model"}
        description={
          toggleTarget?.action === "block"
            ? `Engineers will no longer be able to use ${toggleTarget?.model}. Existing sessions won't be affected.`
            : `Engineers will be able to use ${toggleTarget?.model} through the gateway.`
        }
        confirmLabel={toggleTarget?.action === "block" ? "Block" : "Enable"}
        variant={toggleTarget?.action === "block" ? "danger" : "primary"}
        loading={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate()}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
