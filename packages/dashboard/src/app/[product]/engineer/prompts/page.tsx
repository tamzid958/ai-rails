"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Eye, Plus, Pencil, FileText } from "lucide-react";

type Prompt = {
  id: string;
  taskType: string;
  isBase: boolean;
  engineerId: string | null;
  parentId: string | null;
  parentContent: string | null;
  content: string;
  usageCount: number;
  acceptRate: number | null;
  reviseRate: number | null;
};

export default function PromptsPage() {
  const { product, engineer } = useProduct();
  const queryClient = useQueryClient();

  const [viewPrompt, setViewPrompt] = useState<Prompt | null>(null);
  const [createFor, setCreateFor] = useState<Prompt | null>(null);
  const [editPrompt, setEditPrompt] = useState<Prompt | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["engineer-prompts", product.id, engineer.id],
    queryFn: () => api.getPrompts(product.id, engineer.id),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!createFor) throw new Error("No base template selected");
      return api.createOverride(product.id, createFor.id, content.trim());
    },
    onSuccess: () => {
      setCreateFor(null);
      setContent("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["engineer-prompts"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editPrompt) throw new Error("No prompt selected");
      return api.updateOverride(editPrompt.id, content.trim());
    },
    onSuccess: () => {
      setEditPrompt(null);
      setContent("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["engineer-prompts"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  // Group by taskType: base + optional override
  const grouped = new Map<string, { base: Prompt; override?: Prompt }>();
  if (prompts) {
    for (const p of prompts) {
      if (p.isBase) {
        if (!grouped.has(p.taskType)) grouped.set(p.taskType, { base: p });
        else {
          const entry = grouped.get(p.taskType);
          if (entry) entry.base = p;
        }
      } else if (p.engineerId === engineer.id) {
        const existing = grouped.get(p.taskType);
        if (existing) existing.override = p;
      }
    }
  }

  const rows = Array.from(grouped.values());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Prompts" description={`Your prompt templates and overrides for ${product.name}`} />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No prompt templates"
          description="No base templates have been created for this product yet. Ask a team lead to set them up."
          icon={<FileText size={32} />}
        />
      ) : (
        <ChartCard
          title="Templates"
          action={<span className="text-xs text-text-muted tabular-nums">{rows.length} task types</span>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Uses</TableHead>
                <TableHead className="text-right">Accept</TableHead>
                <TableHead className="w-24">{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ base, override }) => {
                const active = override ?? base;
                const hasOverride = !!override;
                return (
                  <TableRow key={base.taskType}>
                    <TableCell mono>{base.taskType}</TableCell>
                    <TableCell>
                      {hasOverride ? (
                        <Badge variant="info">Your Override</Badge>
                      ) : (
                        <Badge variant="default">Base</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums" mono>{active.usageCount}</TableCell>
                    <TableCell className="text-right" mono>
                      {active.acceptRate != null ? (
                        <span
                          className={
                            active.acceptRate >= 70
                              ? "text-emerald-400"
                              : active.acceptRate >= 50
                                ? "text-amber-400"
                                : "text-red-400"
                          }
                        >
                          {active.acceptRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewPrompt(active)}
                          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye size={14} strokeWidth={1.5} />
                        </button>
                        {hasOverride ? (
                          <button
                            onClick={() => { setEditPrompt(override); setContent(override.content); setError(""); }}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                            title="Edit override"
                          >
                            <Pencil size={14} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setCreateFor(base); setContent(base.content); setError(""); }}
                            className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                            title="Create override"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ChartCard>
      )}

      {/* View Dialog */}
      <Dialog open={viewPrompt !== null} onOpenChange={(o) => { if (!o) setViewPrompt(null); }}>
        {viewPrompt && (
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>{viewPrompt.taskType}</DialogTitle>
              <DialogDescription>
                {viewPrompt.isBase ? "Base template" : "Your personal override"}
                {viewPrompt.acceptRate != null && ` · ${viewPrompt.acceptRate.toFixed(1)}% acceptance`}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              {!viewPrompt.isBase && viewPrompt.parentContent && (
                <div className="mb-4">
                  <p className="text-[11px] text-text-muted mb-1.5">Base template (for reference)</p>
                  <pre className="rounded-lg bg-surface border border-border-subtle p-3 font-mono text-xs leading-relaxed text-text-muted whitespace-pre-wrap max-h-28 overflow-auto">
                    {viewPrompt.parentContent}
                  </pre>
                </div>
              )}
              <p className="text-[11px] text-text-muted mb-1.5">
                {viewPrompt.isBase ? "Content" : "Your override"}
              </p>
              <pre className="rounded-lg bg-surface border border-border-subtle p-3.5 font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
                {viewPrompt.content}
              </pre>
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>

      {/* Create Override Dialog */}
      <Dialog open={createFor !== null} onOpenChange={(o) => { if (!o) setCreateFor(null); }}>
        {createFor && (
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Create Override — {createFor.taskType}</DialogTitle>
              <DialogDescription>
                Customize this template for your workflow. Your override will be used instead of the base.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <p className="text-[11px] text-text-muted mb-1.5">Base template (starting point)</p>
                <pre className="rounded-lg bg-surface border border-border-subtle p-3 font-mono text-xs leading-relaxed text-text-muted whitespace-pre-wrap max-h-28 overflow-auto">
                  {createFor.content}
                </pre>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Your override</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="Customize the base template for your needs..."
                  className="w-full rounded-md border border-border-muted bg-surface px-3.5 py-3 font-mono text-xs leading-relaxed text-text-primary outline-none resize-y focus:border-accent/50 transition-colors"
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setCreateFor(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => { if (!content.trim()) { setError("Content is required"); return; } createMutation.mutate(); }}
                loading={createMutation.isPending}
              >
                Create Override
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Override Dialog */}
      <Dialog open={editPrompt !== null} onOpenChange={(o) => { if (!o) setEditPrompt(null); }}>
        {editPrompt && (
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Edit Override — {editPrompt.taskType}</DialogTitle>
              <DialogDescription>Update your personal override. Changes take effect immediately.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="w-full rounded-md border border-border-muted bg-surface px-3.5 py-3 font-mono text-xs leading-relaxed text-text-primary outline-none resize-y focus:border-accent/50 transition-colors"
              />
              {error && <p className="text-xs text-danger mt-2">{error}</p>}
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setEditPrompt(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => { if (!content.trim()) { setError("Content is required"); return; } updateMutation.mutate(); }}
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
