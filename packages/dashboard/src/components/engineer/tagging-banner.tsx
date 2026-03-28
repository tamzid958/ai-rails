"use client";

import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { Info } from "lucide-react";

export function TaggingBanner() {
  const { product } = useProduct();

  const { data } = useQuery({
    queryKey: ["tagging-stats", product.id],
    queryFn: () => api.getTaggingStats(product.id),
  });

  if (!data || data.total === 0 || data.tagged >= data.total) return null;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info size={16} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-text-secondary">
            You&apos;ve tagged{" "}
            <span className="font-medium tabular-nums">{data.tagged} of {data.total}</span>{" "}
            AI-assisted commits in {data.productName} this week.
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Tag your commits for better insights — <code className="font-mono text-xs">airails commit --ai &lt;tool&gt;</code>
          </p>
        </div>
      </div>
    </div>
  );
}
