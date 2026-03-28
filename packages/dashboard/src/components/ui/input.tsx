"use client";

import { type ComponentPropsWithoutRef, forwardRef, useId } from "react";
import clsx from "clsx";

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    const id = useId();

    return (
      <div className={clsx("flex flex-col gap-1", className)}>
        {label && (
          <label
            htmlFor={id}
            className="text-label uppercase text-gray-500 tracking-[0.06em]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full p-2 text-body bg-white text-black outline-none ring-0",
            error
              ? "border-2 border-danger"
              : "border border-gray-200 focus:border-2 focus:border-accent",
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-small text-danger">
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
