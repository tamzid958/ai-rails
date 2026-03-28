"use client";

import { type ComponentPropsWithoutRef, forwardRef, useId } from "react";
import clsx from "clsx";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "id"> & {
  label?: string;
  error?: string;
  options: SelectOption[];
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
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
        <select
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
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${id}-error`} className="text-small text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectOption };
