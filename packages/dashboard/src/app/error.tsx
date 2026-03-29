"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center animate-fade-in">
      <div className="text-gray-600 mb-4">
        <AlertTriangle size={40} strokeWidth={1} />
      </div>
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Error 500
      </p>
      <h1 className="text-2xl font-semibold text-text-primary mt-1">
        Something went wrong
      </h1>
      <p className="text-sm text-text-tertiary mt-2">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="sm" onClick={reset}>
          Try again
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
