"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import { Cpu, Plus } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { LITELLM_MODELS } from "@/lib/litellm-models";

export default function ProvidersPage() {
  const { product, isOwner, isLead } = useProduct();
  const queryClient = useQueryClient();
  const canManage = isOwner || isLead;

  const [toggleTarget, setToggleTarget] = useState<{ model: string; action: "block" | "unblock" } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [litellmModel, setLitellmModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [addError, setAddError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/providers/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          modelName: modelName.trim(),
          litellmModel: litellmModel.trim(),
          apiKey: apiKey.trim() || undefined,
          apiBase: apiBase.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed (${res.status})`);
      }
    },
    onSuccess: () => {
      setAddOpen(false);
      setModelName("");
      setLitellmModel("");
      setApiKey("");
      setApiBase("");
      setAddError("");
      queryClient.invalidateQueries({ queryKey: ["settings-providers"] });
    },
    onError: (err: Error) => setAddError(err.message),
  });

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
        description="Manage which AI models are available for this product. Models added here persist until LiteLLM restarts — add them to litellm/config.yaml for permanence."
        actions={canManage ? (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} strokeWidth={1.5} className="mr-1" /> Add Model
          </Button>
        ) : undefined}
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
                  <TableCell colSpan={canManage ? 4 : 3}>
                    <EmptyState title="No providers" description="No AI models are configured for this product." icon={<Cpu size={32} />} compact />
                  </TableCell>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
            <DialogDescription>
              Add a new model to LiteLLM. It will be available to all products immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Input
              label="Display Name"
              placeholder="e.g. gpt-4-turbo"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
            <Combobox
              label="LiteLLM Model ID"
              placeholder="Search models... (e.g. gpt-4o, claude, llama)"
              options={LITELLM_MODELS}
              value={litellmModel}
              onChange={(val) => {
                setLitellmModel(val);
                if (!modelName.trim()) {
                  const match = LITELLM_MODELS.find((m) => m.value === val);
                  if (match) setModelName(match.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors text-left"
            >
              {showAdvanced ? "Hide advanced options" : "Advanced options (custom API key, endpoint)"}
            </button>
            {showAdvanced && (
              <div className="space-y-4 border-t border-border-subtle pt-4">
                <Input
                  label="API Key"
                  placeholder="Uses env var if blank"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Input
                  label="API Base URL"
                  placeholder="e.g. https://custom-endpoint.com/v1"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                />
                <p className="text-xs text-text-tertiary">
                  Only needed for custom deployments (Azure, self-hosted). Most providers use the API key from your <code className="font-mono">.env</code> automatically.
                </p>
              </div>
            )}
            {addError && (
              <p className="text-sm text-danger">{addError}</p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!modelName.trim() || !litellmModel.trim() || addMutation.isPending}
              loading={addMutation.isPending}
            >
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
