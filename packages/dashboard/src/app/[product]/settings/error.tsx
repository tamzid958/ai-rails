"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fade-in">
      <div className="text-gray-600 mb-4">
        <AlertTriangle size={40} strokeWidth={1} />
      </div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Error
      </p>
      <h1 className="text-2xl font-semibold text-text-primary mt-1">
        Settings unavailable
      </h1>
      <p className="text-sm text-text-tertiary mt-2">
        Failed to load settings. Please try again.
      </p>
      <div className="mt-6">
        <Button variant="secondary" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
