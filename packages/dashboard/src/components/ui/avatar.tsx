"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import clsx from "clsx";
import { forwardRef } from "react";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type AvatarProps = { name: string; src?: string; size?: "sm" | "md" | "lg"; className?: string };

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, src, size = "sm", className }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-accent/10",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center text-accent font-medium"
        delayMs={src ? 600 : 0}
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  ),
);
Avatar.displayName = "Avatar";

export { Avatar };
export type { AvatarProps };
