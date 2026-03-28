"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function ApiKeysPage() {
  const { product } = useProduct();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["settings-keys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => {
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: ["settings-keys"] });
    },
  });

  function handleCreate() {
    if (!label.trim()) {
      setLabelError("Label is required");
      return;
    }
    setLabelError("");
    createMutation.mutate();
  }

  function handleCopy() {
    const key = rawKeyRef.current;
    if (key) {
      navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDismissKey() {
    rawKeyRef.current = null;
    setRawKey(null);
  }

  return (
    <div>
      <PageHeader title="API Keys" />

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <Input
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={labelError}
            placeholder="e.g. Cursor, CLI"
            className="w-60"
          />
          <Button
            onClick={handleCreate}
            loading={createMutation.isPending}
          >
            Create Key
          </Button>
        </div>
      </div>

      {rawKey && (
        <div className="border-2 border-accent bg-accent/5 p-3 mb-4">
          <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
            Your API Key
          </p>
          <div className="flex items-center gap-2">
            <code className="text-mono flex-1 break-all">{rawKey}</code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDismissKey}>
              Dismiss
            </Button>
          </div>
          <p className="text-small text-danger mt-2">
            This key will only be shown once. Copy it now.
          </p>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
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
                    {formatDistanceToNow(new Date(key.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {key.lastUsedAt
                      ? formatDistanceToNow(new Date(key.lastUsedAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRevokeId(key.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No API keys. Create one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
