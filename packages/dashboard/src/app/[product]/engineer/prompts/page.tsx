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
import { Eye, Plus, Pencil } from "lucide-react";

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
  const [createFor, setCreateFor] = useState<Prompt | null>(null); // base template to override
  const [editPrompt, setEditPrompt] = useState<Prompt | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["engineer-prompts", product.id, engineer.id],
    queryFn: () => api.getPrompts(product.id, engineer.id),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createOverride(product.id, createFor!.id, content.trim()),
    onSuccess: () => {
      setCreateFor(null);
      setContent("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["engineer-prompts"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateOverride(editPrompt!.id, content.trim()),
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
        else grouped.get(p.taskType)!.base = p;
      } else if (p.engineerId === engineer.id) {
        const existing = grouped.get(p.taskType);
        if (existing) existing.override = p;
      }
    }
  }

  const rows = Array.from(grouped.values());

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Prompts" description={`Your prompt templates and overrides for ${product.name}`} />

      {isLoading ? <Skeleton className="h-48" /> : rows.length === 0 ? (
        <EmptyState title="No prompt templates" description="No base templates have been created for this product yet. Ask a team lead to set them up." />
      ) : (
        <ChartCard title="Templates" action={<span className="text-xs text-text-muted tabular-nums">{rows.length} task types</span>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Accept</TableHead>
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
                    <TableCell className="tabular-nums">{active.usageCount}</TableCell>
                    <TableCell className="tabular-nums">{active.acceptRate != null ? `${active.acceptRate.toFixed(1)}%` : "\u2014"}</TableCell>
                    <TableCell>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => setViewPrompt(active)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer" title="View">
                          <Eye size={14} strokeWidth={1.5} />
                        </button>
                        {hasOverride ? (
                          <button onClick={() => { setEditPrompt(override); setContent(override.content); setError(""); }} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer" title="Edit override">
                            <Pencil size={14} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button onClick={() => { setCreateFor(base); setContent(base.content); setError(""); }} className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer" title="Create override">
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
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{viewPrompt?.taskType}</DialogTitle>
            <DialogDescription>
              {viewPrompt?.isBase ? "Base template" : "Your personal override"}
              {viewPrompt?.acceptRate != null && ` · ${viewPrompt.acceptRate.toFixed(1)}% acceptance`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {viewPrompt && !viewPrompt.isBase && viewPrompt.parentContent && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Base template (for reference)</p>
                <pre style={{ padding: 12, fontSize: 12, lineHeight: 1.7, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", background: "var(--color-surface)", borderRadius: 6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
                  {viewPrompt.parentContent}
                </pre>
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>
              {viewPrompt?.isBase ? "Content" : "Your override"}
            </p>
            <pre style={{ padding: 14, fontSize: 12, lineHeight: 1.7, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", background: "var(--color-surface)", borderRadius: 6, whiteSpace: "pre-wrap" }}>
              {viewPrompt?.content}
            </pre>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Create Override Dialog */}
      <Dialog open={createFor !== null} onOpenChange={(o) => { if (!o) setCreateFor(null); }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Create Override — {createFor?.taskType}</DialogTitle>
            <DialogDescription>Customize this template for your workflow. Your override will be used instead of the base, and AIRAILS will track its acceptance rate.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Base template (starting point)</p>
              <pre style={{ padding: 12, fontSize: 12, lineHeight: 1.7, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", background: "var(--color-surface)", borderRadius: 6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
                {createFor?.content}
              </pre>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>Your override</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="Customize the base template for your needs..."
                style={{ width: "100%", padding: "12px 14px", fontSize: 12, lineHeight: 1.7, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", background: "var(--color-surface)", border: "1px solid var(--color-border-muted)", borderRadius: 6, outline: "none", resize: "vertical" }}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setCreateFor(null)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (!content.trim()) { setError("Content is required"); return; } createMutation.mutate(); }} loading={createMutation.isPending}>Create Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Override Dialog */}
      <Dialog open={editPrompt !== null} onOpenChange={(o) => { if (!o) setEditPrompt(null); }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Edit Override — {editPrompt?.taskType}</DialogTitle>
            <DialogDescription>Update your personal override. Changes take effect immediately.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              style={{ width: "100%", padding: "12px 14px", fontSize: 12, lineHeight: 1.7, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", background: "var(--color-surface)", border: "1px solid var(--color-border-muted)", borderRadius: 6, outline: "none", resize: "vertical" }}
            />
            {error && <p className="text-xs text-danger mt-2">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setEditPrompt(null)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (!content.trim()) { setError("Content is required"); return; } updateMutation.mutate(); }} loading={updateMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
