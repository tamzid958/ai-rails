"use client";

// Smooth scroll disabled — native scroll works fine.
// Kept as placeholder for future use.

import { createContext, useContext, type ReactNode } from "react";

const SmoothScrollContext = createContext<null>(null);

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollContext.Provider value={null}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
