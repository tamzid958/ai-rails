"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import clsx from "clsx";
import type { ReactNode } from "react";

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({ children, content, side = "right", sideOffset = 8 }: {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className={clsx(
            "z-50 px-3 py-1.5 text-xs font-medium",
            "bg-gray-100 text-gray-900 rounded-md shadow-md",
            "data-[state=delayed-open]:animate-fade-in",
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip, TooltipProvider };
