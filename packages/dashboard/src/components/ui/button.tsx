"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

const VARIANT_CLASSES = {
  primary:
    "bg-white text-gray-900 shadow-xs hover:bg-gray-100 hover:shadow-sm active:bg-white",
  secondary:
    "bg-surface-raised border border-border-muted text-text-secondary shadow-xs hover:bg-surface-raised hover:shadow-sm active:bg-surface-raised",
  ghost:
    "text-text-tertiary hover:bg-surface-raised hover:text-text-primary active:bg-surface-raised",
  danger:
    "bg-surface-raised border border-border-muted text-danger shadow-xs hover:bg-danger-tint hover:border-danger/30 active:bg-danger-tint",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2.5 text-sm rounded-md",
  lg: "px-5 py-3 text-sm rounded-md",
} as const;

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  loading?: boolean;
  asChild?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      asChild = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading</span>
          </span>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
