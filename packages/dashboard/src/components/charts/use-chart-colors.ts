"use client";

import { useSyncExternalStore } from "react";

const FALLBACKS = ["#3b82f6", "#8b5cf6", "#34d399", "#fbbf24", "#f87171", "#f472b6"];
const VAR_NAMES = ["--color-chart-1", "--color-chart-2", "--color-chart-3", "--color-chart-4", "--color-chart-5", "--color-chart-6"];

let cachedColors: string[] | null = null;

function resolveColors(): string[] {
  if (typeof window === "undefined") return FALLBACKS;
  if (cachedColors) return cachedColors;
  const styles = getComputedStyle(document.documentElement);
  cachedColors = VAR_NAMES.map((v, i) => styles.getPropertyValue(v).trim() || FALLBACKS[i]);
  return cachedColors;
}

function subscribe() { return () => {}; }

export function useChartColors(): string[] {
  return useSyncExternalStore(subscribe, resolveColors, () => FALLBACKS);
}

let cachedVars: { grid: string; axisFill: string; borderMuted: string } | null = null;

function resolveVars() {
  if (typeof window === "undefined") return { grid: "rgba(255,255,255,0.06)", axisFill: "rgba(255,255,255,0.25)", borderMuted: "rgba(255,255,255,0.1)" };
  if (cachedVars) return cachedVars;
  const s = getComputedStyle(document.documentElement);
  cachedVars = {
    grid: s.getPropertyValue("--color-border-subtle").trim() || "rgba(255,255,255,0.06)",
    axisFill: s.getPropertyValue("--color-text-muted").trim() || "rgba(255,255,255,0.25)",
    borderMuted: s.getPropertyValue("--color-border-muted").trim() || "rgba(255,255,255,0.1)",
  };
  return cachedVars;
}

export function useThemeVars() {
  return useSyncExternalStore(subscribe, resolveVars, () => ({ grid: "rgba(255,255,255,0.06)", axisFill: "rgba(255,255,255,0.25)", borderMuted: "rgba(255,255,255,0.1)" }));
}
