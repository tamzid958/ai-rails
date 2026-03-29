"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Copy, Check, Key } from "lucide-react";

export default function ApiKeysPage() {
  const { product } = useProduct();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const rawKeyRef = useRef<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["settings-keys", product.id],
    queryFn: () => api.getApiKeys(product.id),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createApiKey(product.id, label.trim()),
    onSuccess: (data) => {
      rawKeyRef.current = data.rawKey;
      setRawKey(data.rawKey);
      setLabel("");
      setLabelError("");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["settings-keys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => { setRevokeId(null); queryClient.invalidateQueries({ queryKey: ["settings-keys"] }); },
  });

  function handleCreate() {
    if (!label.trim()) { setLabelError("Label is required"); return; }
    setLabelError(""); createMutation.mutate();
  }

  function handleCopy() {
    const key = rawKeyRef.current;
    if (key) { navigator.clipboard.writeText(key); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  function handleDismissKey() { rawKeyRef.current = null; setRawKey(null); }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="API Keys"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} strokeWidth={1.5} /> Create Key
          </Button>
        }
      />

      {/* New key reveal */}
      {rawKey && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Key size={14} strokeWidth={1.5} className="text-accent" />
            <span className="text-xs text-text-tertiary">Your new API key</span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 font-mono text-sm text-text-primary break-all bg-surface rounded-md px-3 py-2">{rawKey}</code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <><Check size={14} strokeWidth={1.5} /> Copied</> : <><Copy size={14} strokeWidth={1.5} /> Copy</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismissKey}>Dismiss</Button>
          </div>
          <p className="text-xs text-danger mt-3">This key will only be shown once. Copy it now.</p>
        </div>
      )}

      <ChartCard
        title="Active Keys"
        action={keys?.length ? <span className="text-xs text-text-muted tabular-nums">{keys.length} total</span> : undefined}
      >
        {isLoading ? <Skeleton className="h-48" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys?.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.label}</TableCell>
                  <TableCell mono>{key.keyPrefix}</TableCell>
                  <TableCell>
                    <Tooltip content={format(new Date(key.createdAt), "PPpp")}>
                      <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {key.lastUsedAt ? (
                      <Tooltip content={format(new Date(key.lastUsedAt), "PPpp")}>
                        <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}</span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-text-muted">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setRevokeId(key.id)} className="text-danger">Revoke</Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState title="No API keys" description="Create a key for gateway integration." icon={<Key size={32} />} compact />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ChartCard>

      {/* Create Key Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Create a key for gateway integration.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} error={labelError} placeholder="e.g. Cursor, CLI" />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} loading={createMutation.isPending}>Create Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revokeId !== null}
        title="Revoke API Key"
        description="This key will be permanently deactivated. Any integrations using it will stop working."
        confirmLabel="Revoke"
        variant="danger"
        loading={revokeMutation.isPending}
        onConfirm={() => revokeId && revokeMutation.mutate(revokeId)}
        onCancel={() => setRevokeId(null)}
      />
    </div>
  );
}
