"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import clsx from "clsx";
import { forwardRef } from "react";

type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  strong?: boolean;
};

const Separator = forwardRef<React.ComponentRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(
  ({ strong = false, orientation = "horizontal", className, ...props }, ref) => {
    const color = strong
      ? "bg-gray-600"
      : "bg-gray-800";

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        orientation={orientation}
        decorative
        className={clsx(
          color,
          orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };
