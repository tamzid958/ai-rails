"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import clsx from "clsx";

const VARIANT_CLASSES = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-gray-200 text-black hover:bg-gray-50",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

const SIZE_CLASSES = {
  sm: "px-2 py-1 text-small",
  md: "px-3 py-1 text-body",
  lg: "px-4 py-2 text-body",
} as const;

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center font-medium",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          isDisabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {loading ? "..." : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
