"use client";

import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";

export function TaggingBanner() {
  const { product } = useProduct();

  const { data } = useQuery({
    queryKey: ["tagging-stats", product.id],
    queryFn: () => api.getTaggingStats(product.id),
  });

  if (!data || data.total === 0 || data.tagged >= data.total) return null;

  return (
    <div className="border border-gray-200 bg-gray-50 p-3 mb-3">
      <p className="text-body">
        You&apos;ve tagged{" "}
        <span className="font-medium tabular-nums">
          {data.tagged} of {data.total}
        </span>{" "}
        AI-assisted commits in {data.productName} this week.
      </p>
      <p className="text-small text-gray-500 mt-1">
        Tag your commits for better insights →{" "}
        <code className="font-mono text-mono">airails commit --ai &lt;tool&gt;</code>
      </p>
    </div>
  );
}
