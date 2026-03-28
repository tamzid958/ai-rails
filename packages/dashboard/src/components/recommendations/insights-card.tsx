"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";

const PRIORITY_CONFIG = {
  2: { label: "HIGH", variant: "error" },
  1: { label: "MEDIUM", variant: "warning" },
  0: { label: "LOW", variant: "default" },
} as const;

const PAGE_SIZE = 3;

export function InsightsCard() {
  const { product } = useProduct();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["team-recommendations", product.id, page],
    queryFn: () => api.getTeamRecommendations(product.id, PAGE_SIZE, page * PAGE_SIZE),
    placeholderData: (prev) => prev,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.dismissRecommendation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-recommendations", product.id] }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading && !data) return <Skeleton className="h-20 rounded-lg" />;
  if (total === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} strokeWidth={1.5} className="text-accent" />
          <span className="text-xs font-medium text-text-tertiary">{total} insight{total !== 1 ? "s" : ""}</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <span className="text-xs text-text-muted tabular-nums">{page + 1}/{totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((rec) => {
          const config = PRIORITY_CONFIG[rec.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG[0];
          return (
            <div key={rec.id} className="flex items-start gap-3 bg-surface rounded-lg border border-border-subtle p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary leading-relaxed">{rec.body}</p>
              </div>
              <Badge variant={config.variant as "error" | "warning" | "default"} className="shrink-0 mt-0.5">{config.label}</Badge>
              <button onClick={() => dismissMutation.mutate(rec.id)} className="text-text-muted hover:text-text-secondary cursor-pointer transition-colors shrink-0 mt-0.5 p-0.5" aria-label="Dismiss">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
