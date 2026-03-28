"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, X } from "lucide-react";

const PRIORITY_CONFIG = {
  2: { label: "HIGH", variant: "error" },
  1: { label: "MEDIUM", variant: "warning" },
  0: { label: "LOW", variant: "default" },
} as const;

export function SuggestionsCard() {
  const { product, engineer } = useProduct();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data: recs, isLoading } = useQuery({
    queryKey: ["recommendations", product.id, engineer.id],
    queryFn: () => api.getRecommendations(product.id, engineer.id),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.dismissRecommendation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations", product.id] }),
  });

  const activeRecs = recs?.filter((r) => !r.dismissedAt) ?? [];
  const MAX_VISIBLE = 3;
  const visibleRecs = showAll ? activeRecs : activeRecs.slice(0, MAX_VISIBLE);
  const hasMore = activeRecs.length > MAX_VISIBLE;

  if (isLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (activeRecs.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} strokeWidth={1.5} className="text-accent" />
          <span className="text-xs font-medium text-text-tertiary">{activeRecs.length} suggestion{activeRecs.length !== 1 ? "s" : ""}</span>
        </div>
        {hasMore && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-accent hover:text-accent-hover cursor-pointer transition-colors">
            {showAll ? "Show less" : "View all"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {visibleRecs.map((rec) => {
          const config = PRIORITY_CONFIG[rec.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG[0];
          return (
            <div key={rec.id} className="flex items-start gap-3 bg-surface rounded-lg border border-border-subtle p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary leading-relaxed">{rec.body}</p>
              </div>
              <Badge variant={config.variant as "error" | "warning" | "default"} className="shrink-0 mt-0.5">{config.label}</Badge>
              <button
                onClick={() => dismissMutation.mutate(rec.id)}
                className="text-text-muted hover:text-text-secondary cursor-pointer transition-colors shrink-0 mt-0.5 p-0.5"
                aria-label="Dismiss"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
