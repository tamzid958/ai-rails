"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans bg-bg-primary">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Error 500
          </p>
          <h1 className="text-2xl font-semibold text-text-primary mt-1">
            Something went wrong
          </h1>
          <p className="text-sm text-text-tertiary mt-2">
            An unexpected error occurred. Please try again.
          </p>
          <div className="mt-6">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-none border border-border-primary bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
