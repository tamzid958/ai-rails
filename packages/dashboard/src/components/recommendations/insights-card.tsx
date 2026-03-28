"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

const PRIORITY_CONFIG = {
  2: { label: "HIGH", variant: "error" },
  1: { label: "MEDIUM", variant: "warning" },
  0: { label: "LOW", variant: "default" },
} as const;

function PriorityBadge({ priority }: { priority: number }) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG[0];
  return <Badge variant={config.variant as "error" | "warning" | "default"}>{config.label}</Badge>;
}

export function InsightsCard() {
  const { product } = useProduct();
  const queryClient = useQueryClient();

  const { data: recs, isLoading } = useQuery({
    queryKey: ["team-recommendations", product.id],
    queryFn: () => api.getTeamRecommendations(product.id),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.dismissRecommendation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-recommendations", product.id] }),
  });

  const activeRecs = recs?.filter((r) => !r.dismissedAt) ?? [];

  if (isLoading) return <div className="bg-surface-raised border border-border-subtle rounded-lg p-6"><Skeleton className="h-32" /></div>;

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.5} className="text-accent" />
          <h3 className="text-sm font-medium text-text-primary">Team Insights</h3>
        </div>
        {activeRecs.length > 0 && <span className="text-xs text-text-tertiary">{activeRecs.length} new</span>}
      </div>

      {activeRecs.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-4">No team insights right now.</p>
      ) : (
        <div className="space-y-4">
          {activeRecs.map((rec) => (
            <div key={rec.id} className="border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm text-text-secondary mb-3">{rec.body}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {rec.type === "promote_override" && <Button variant="secondary" size="sm" disabled>Promote</Button>}
                  {rec.type === "template_degradation" && <Button variant="secondary" size="sm" disabled>Review Template</Button>}
                  <Button variant="ghost" size="sm" onClick={() => dismissMutation.mutate(rec.id)} loading={dismissMutation.isPending}>Dismiss</Button>
                </div>
                <PriorityBadge priority={rec.priority} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
