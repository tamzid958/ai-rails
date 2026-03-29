"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, FileText } from "lucide-react";

export default function TeamPromptsPage() {
  const { product } = useProduct();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [taskType, setTaskType] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [createError, setCreateError] = useState("");

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["team-prompts", product.id],
    queryFn: () => api.getTeamPrompts(product.id),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createBaseTemplate(product.id, taskType.trim(), name.trim(), content.trim()),
    onSuccess: () => {
      setCreateOpen(false);
      setTaskType("");
      setName("");
      setContent("");
      setCreateError("");
      queryClient.invalidateQueries({ queryKey: ["team-prompts"] });
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  function handleCreate() {
    if (!taskType.trim()) { setCreateError("Task type is required"); return; }
    if (!name.trim()) { setCreateError("Name is required"); return; }
    if (!content.trim()) { setCreateError("Content is required"); return; }
    setCreateError("");
    createMutation.mutate();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Prompt Registry"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} strokeWidth={1.5} /> Create Template
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !prompts?.length ? (
        <EmptyState
          title="No prompt templates"
          description="Create a base template to get started. Engineers can create personal overrides from it."
          icon={<FileText size={32} />}
        />
      ) : (
        <ChartCard
          title={`${prompts.length} Template${prompts.length !== 1 ? "s" : ""}`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead className="text-right">Base Uses</TableHead>
                <TableHead className="text-right">Overrides</TableHead>
                <TableHead>Best Rate</TableHead>
                <TableHead className="w-12">{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((row, idx) => {
                const bestOverride = row.overrides.reduce<{ rate: number; name: string } | null>((best, o) => {
                  if (o.acceptRate == null) return best;
                  if (!best || o.acceptRate > best.rate) return { rate: o.acceptRate, name: o.engineerName };
                  return best;
                }, null);

                const bestRate = bestOverride && (row.baseAcceptRate == null || bestOverride.rate > row.baseAcceptRate)
                  ? `${bestOverride.rate}% (${bestOverride.name})`
                  : row.baseAcceptRate != null ? `${row.baseAcceptRate}% (base)` : "—";

                const rateValue = bestOverride
                  ? (row.baseAcceptRate != null && row.baseAcceptRate > bestOverride.rate ? row.baseAcceptRate : bestOverride.rate)
                  : row.baseAcceptRate;

                return (
                  <TableRow key={`${row.taskType}-${idx}`}>
                    <TableCell mono>{row.taskType}</TableCell>
                    <TableCell className="text-right tabular-nums" mono>{row.baseUses}</TableCell>
                    <TableCell className="text-right tabular-nums" mono>{row.overrides.length}</TableCell>
                    <TableCell>
                      <span
                        className={
                          rateValue == null
                            ? "text-text-muted"
                            : rateValue >= 70
                              ? "text-emerald-400"
                              : rateValue >= 50
                                ? "text-amber-400"
                                : "text-red-400"
                        }
                      >
                        {bestRate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/${product.slug}/team/prompts/${encodeURIComponent(row.taskType)}`)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                      >
                        <ChevronRight size={14} strokeWidth={1.5} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ChartCard>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Create Base Template</DialogTitle>
            <DialogDescription>
              Define a reusable prompt template for a task type. Engineers can create personal overrides from this base.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Task Type"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                placeholder="e.g. code-review, refactoring, testing"
              />
              <Input
                label="Template Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Code Review"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Prompt Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder={"You are reviewing code for a production application.\n\nRules:\n- Flag security issues\n- Check error handling\n- Verify test coverage\n\nDo not suggest cosmetic changes."}
                className="w-full rounded-md border border-border-muted bg-surface px-3.5 py-3 font-mono text-xs leading-relaxed text-text-primary outline-none resize-y focus:border-accent/50 transition-colors"
              />
            </div>
            {createError && <p className="text-xs text-danger">{createError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} loading={createMutation.isPending}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
