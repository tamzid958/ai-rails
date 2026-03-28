"use client";

import { type ComponentPropsWithoutRef, forwardRef, useId, type ReactNode } from "react";
import clsx from "clsx";

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  label?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, startIcon, endIcon, className, ...props }, ref) => {
    const id = useId();

    return (
      <div className={clsx("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={clsx(
              "w-full h-10 px-3 text-sm bg-surface text-text-primary rounded-md",
              "placeholder:text-text-tertiary transition-all duration-150",
              startIcon && "pl-10",
              endIcon && "pr-10",
              error
                ? "border-2 border-danger focus:ring-2 focus:ring-danger/20"
                : "border border-border-muted focus:border-accent focus:ring-2 focus:ring-accent/20",
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {endIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
