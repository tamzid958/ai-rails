"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

type SelectOption = { value: string; label: string };

type SelectProps = {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function Select({ label, error, options, value, onValueChange, placeholder = "Select...", className }: SelectProps) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={clsx(
            "inline-flex items-center gap-2 h-8 px-2.5 text-xs bg-surface text-text-secondary rounded-md",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            error
              ? "border-2 border-danger"
              : "border border-border-muted",
          )}
          aria-invalid={error ? true : undefined}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon><ChevronDown size={12} strokeWidth={1.5} className="text-text-muted" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={clsx(
              "z-50 min-w-(--radix-select-trigger-width) bg-surface border border-border-subtle rounded-lg shadow-lg",
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md outline-none cursor-pointer",
                    "data-highlighted:bg-surface-raised",
                    "text-text-secondary",
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto">
                    <Check size={14} strokeWidth={2} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export { Select };
export type { SelectProps, SelectOption };
