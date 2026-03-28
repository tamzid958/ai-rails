"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import clsx from "clsx";

const VARIANT_CLASSES = {
  primary: "bg-accent text-white hover:bg-accent-hover active:bg-blue-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
  secondary: "border border-gray-200 text-black hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100",
  ghost: "text-gray-600 hover:text-black hover:bg-gray-100 active:bg-gray-200",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
} as const;

const SIZE_CLASSES = {
  sm: "px-2.5 py-1 text-small gap-1.5",
  md: "px-3.5 py-2 text-body gap-2",
  lg: "px-5 py-2.5 text-body gap-2",
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
          "inline-flex items-center justify-center font-medium transition-all",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent animate-spin" style={{ borderRadius: "50%" }} />
            <span>Loading</span>
          </span>
        ) : children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
