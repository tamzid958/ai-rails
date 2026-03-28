"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, ArrowUp, Copy, Check, FileText, Users } from "lucide-react";

export default function PromptDetailPage() {
  const { product } = useProduct();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskType = decodeURIComponent(params.taskType as string);

  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["team-prompts", product.id],
    queryFn: () => api.getTeamPrompts(product.id),
  });

  const promoteMutation = useMutation({
    mutationFn: (overrideId: string) => api.promoteOverride(product.id, overrideId),
    onSuccess: () => { setPromoteId(null); queryClient.invalidateQueries({ queryKey: ["team-prompts"] }); },
  });

  const row = prompts?.find((p) => p.taskType === taskType);

  function copyContent(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );

  if (!row) return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => router.push(`/${product.slug}/team/prompts`)} className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer">
        <ArrowLeft size={12} strokeWidth={1.5} /> Back to registry
      </button>
      <p className="text-sm text-text-tertiary">Template not found.</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => router.push(`/${product.slug}/team/prompts`)} className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors cursor-pointer mb-6">
          <ArrowLeft size={12} strokeWidth={1.5} /> Prompt Registry
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-text-primary">{taskType}</h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <FileText size={12} strokeWidth={1.5} />
                <span>{row.baseUses} base uses</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Users size={12} strokeWidth={1.5} />
                <span>{row.overrides.length} override{row.overrides.length !== 1 ? "s" : ""}</span>
              </div>
              {row.baseAcceptRate != null && (
                <span className="text-xs text-text-muted tabular-nums">{row.baseAcceptRate}% base acceptance</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two column: base on left, stats on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base template - takes 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-surface-raised rounded-lg border border-border-subtle overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Badge variant="default">Base Template</Badge>
              </div>
              <button
                onClick={() => copyContent("base", row.baseContent)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {copiedId === "base" ? <><Check size={12} strokeWidth={1.5} /> Copied</> : <><Copy size={12} strokeWidth={1.5} /> Copy</>}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary p-5 leading-relaxed">
              {row.baseContent}
            </pre>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-raised rounded-lg border border-border-subtle p-5">
            <p className="text-xs text-text-muted mb-3">Performance</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Base acceptance</span>
                <span className="text-sm font-medium text-text-primary tabular-nums">{row.baseAcceptRate != null ? `${row.baseAcceptRate}%` : "\u2014"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total uses</span>
                <span className="text-sm font-medium text-text-primary tabular-nums">{row.baseUses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Overrides</span>
                <span className="text-sm font-medium text-text-primary tabular-nums">{row.overrides.length}</span>
              </div>
            </div>
          </div>

          {row.overrides.length > 0 && (
            <div className="bg-surface-raised rounded-lg border border-border-subtle p-5">
              <p className="text-xs text-text-muted mb-3">Top performers</p>
              <div className="space-y-2">
                {[...row.overrides]
                  .filter((o) => o.acceptRate != null)
                  .sort((a, b) => (b.acceptRate ?? 0) - (a.acceptRate ?? 0))
                  .slice(0, 3)
                  .map((o) => (
                    <div key={o.id} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary truncate">{o.engineerName}</span>
                      <span className="text-xs text-text-muted tabular-nums ml-2">{o.acceptRate}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overrides */}
      {row.overrides.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-4">Engineer Overrides</h2>
          <div className="space-y-4">
            {row.overrides.map((o) => {
              const canPromote = o.acceptRate != null && row.baseAcceptRate != null && o.acceptRate > row.baseAcceptRate;
              return (
                <div key={o.id} className="bg-surface-raised rounded-lg border border-border-subtle overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{o.engineerName}</span>
                      <span className="text-xs text-text-muted tabular-nums">{o.uses} uses</span>
                      {o.acceptRate != null && (
                        <Badge variant={canPromote ? "success" : "default"}>{o.acceptRate}%</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyContent(o.id, o.content)}
                        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {copiedId === o.id ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                      </button>
                      {canPromote && (
                        <Button size="sm" variant="secondary" onClick={() => setPromoteId(o.id)}>
                          <ArrowUp size={12} strokeWidth={1.5} /> Promote
                        </Button>
                      )}
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary p-5 leading-relaxed">
                    {o.content}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={promoteId !== null}
        title="Promote Override"
        description="This will replace the base template with this override for all engineers. The current base will be archived."
        confirmLabel="Promote"
        variant="primary"
        loading={promoteMutation.isPending}
        onConfirm={() => promoteId && promoteMutation.mutate(promoteId)}
        onCancel={() => setPromoteId(null)}
      />
    </div>
  );
}
