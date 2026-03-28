"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import clsx from "clsx";
import { forwardRef } from "react";

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { value: number; className?: string };

function getSemanticColor(value: number): string {
  if (value >= 75) return "bg-success";
  if (value >= 40) return "bg-warning";
  return "bg-danger";
}

const Progress = forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ value, className, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={clsx("relative h-2 w-full overflow-hidden bg-gray-800 rounded-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={clsx("h-full rounded-full transition-all duration-500 ease-out", getSemanticColor(value))}
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = "Progress";

export { Progress };
export type { ProgressProps };
