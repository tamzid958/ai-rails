"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type RecommendationRow } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_CONFIG = {
  2: { label: "HIGH", variant: "danger" },
  1: { label: "MEDIUM", variant: "warning" },
  0: { label: "LOW", variant: "default" },
} as const;

function PriorityBadge({ priority }: { priority: number }) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG[0];
  return (
    <Badge variant={config.variant as "danger" | "warning" | "default"}>
      {config.label}
    </Badge>
  );
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-recommendations", product.id],
      });
    },
  });

  const activeRecs = recs?.filter((r) => !r.dismissedAt) ?? [];

  if (isLoading) {
    return (
      <div className="border border-gray-200 p-3">
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-label uppercase text-gray-500 tracking-[0.06em]">
          Team Insights
        </h3>
        {activeRecs.length > 0 && (
          <span className="text-label text-gray-400">
            {activeRecs.length} new
          </span>
        )}
      </div>

      {activeRecs.length === 0 ? (
        <p className="text-small text-gray-500 py-4 text-center">
          No team insights right now.
        </p>
      ) : (
        <div className="space-y-3">
          {activeRecs.map((rec) => (
            <TeamRecommendationItem
              key={rec.id}
              rec={rec}
              onDismiss={() => dismissMutation.mutate(rec.id)}
              dismissing={dismissMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamRecommendationItem({
  rec,
  onDismiss,
  dismissing,
}: {
  rec: RecommendationRow;
  onDismiss: () => void;
  dismissing: boolean;
}) {
  return (
    <div className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
      <p className="text-small text-gray-700 mb-2">{rec.body}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {rec.type === "promote_override" && (
            <Button variant="secondary" size="sm" disabled>
              Promote
            </Button>
          )}
          {rec.type === "template_degradation" && (
            <Button variant="secondary" size="sm" disabled>
              Review Template
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onDismiss}
            loading={dismissing}
          >
            Dismiss
          </Button>
        </div>
        <PriorityBadge priority={rec.priority} />
      </div>
    </div>
  );
}
