"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useProduct } from "@/lib/product-context";

type Step = { key: string; label: string; done: boolean };
type OnboardingData = { steps: Step[]; completed: number; total: number };

const STEP_LINKS: Record<string, string> = {
  api_key: "settings/api-keys",
  repo: "settings/repos",
  member: "settings/members",
  activity: "guide",
};

export function OnboardingChecklist() {
  const { product } = useProduct();

  const { data } = useQuery<OnboardingData>({
    queryKey: ["onboarding", product.id],
    queryFn: async () => {
      const res = await fetch(`/api/engineer/onboarding?productId=${product.id}`);
      if (!res.ok) throw new Error("Failed to load onboarding");
      return res.json();
    },
  });

  if (!data || data.completed === data.total) return null;

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <div className="bg-surface-raised rounded-lg border border-border-subtle px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-text-tertiary">Setup</span>
          <span className="text-xs font-medium text-accent tabular-nums">{pct}%</span>
        </div>
        <div className="flex-1 bg-surface h-1 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          {data.steps.map((step) => {
            const href = STEP_LINKS[step.key];
            const dot = step.done ? (
              <Check size={10} className="text-success" strokeWidth={3} />
            ) : (
              <Circle size={10} className="text-text-tertiary" />
            );

            if (href && !step.done) {
              return (
                <Link
                  key={step.key}
                  href={`/${product.slug}/${href}`}
                  className="group flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface transition-colors"
                  title={step.label}
                >
                  {dot}
                  <span className="text-xs text-text-secondary group-hover:text-accent transition-colors">{step.label}</span>
                  <ArrowRight size={10} className="text-text-tertiary group-hover:text-accent transition-colors" />
                </Link>
              );
            }

            return (
              <span key={step.key} className="flex items-center gap-1 px-1.5 py-0.5" title={step.label}>
                {dot}
                <span className={`text-xs ${step.done ? "text-text-tertiary line-through" : "text-text-secondary"}`}>{step.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
