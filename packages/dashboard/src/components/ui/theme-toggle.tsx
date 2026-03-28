"use client";

// Theme toggle — currently unused (dark-only mode).
// Kept for future light theme support.

import { Sun, Moon } from "lucide-react";
import { useSyncExternalStore } from "react";

function getIsDark() {
  if (typeof window === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getIsDark, () => true);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
    </button>
  );
}

export { ThemeToggle };
