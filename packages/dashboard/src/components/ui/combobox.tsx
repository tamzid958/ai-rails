"use client";

import { useState, useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import clsx from "clsx";

type ComboboxOption = {
  value: string;
  label: string;
  group?: string;
};

type ComboboxProps = {
  label?: string;
  error?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function Combobox({ label, error, options, value, onChange, placeholder = "Search...", className }: ComboboxProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter(
        (o) =>
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.group?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : options;

  const groups = new Map<string, ComboboxOption[]>();
  for (const opt of filtered) {
    const g = opt.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(opt);
  }

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            className={clsx(
              "flex items-center justify-between w-full h-10 px-3 text-sm rounded-md transition-all text-left",
              "bg-surface",
              selected ? "text-text-primary" : "text-text-tertiary",
              error
                ? "border-2 border-danger"
                : "border border-border-muted hover:border-accent/50",
            )}
          >
            <span className="truncate">
              {selected ? (
                <><span className="font-mono">{selected.value}</span><span className="text-text-tertiary ml-2">{selected.label}</span></>
              ) : placeholder}
            </span>
            <ChevronDown size={14} className="text-text-tertiary shrink-0 ml-2" />
          </button>
        </Popover.Trigger>

          <Popover.Content
            side="bottom"
            sideOffset={4}
            align="start"
            avoidCollisions={false}
            style={{ width: "var(--radix-popover-trigger-width)" }}
            className="z-100 bg-surface border border-border-subtle rounded-lg shadow-lg"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
              <Search size={14} className="text-text-tertiary shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div
              className="max-h-40 overflow-y-auto overscroll-contain p-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-tertiary">
                  No models found
                </div>
              ) : (
                Array.from(groups.entries()).map(([group, items]) => (
                  <div key={group}>
                    {group && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-muted sticky top-0 bg-surface">
                        {group}
                      </div>
                    )}
                    {items.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={clsx(
                          "flex items-center gap-2 w-full px-3 py-1.5 text-left rounded-md outline-none cursor-pointer",
                          "hover:bg-surface-raised transition-colors",
                          opt.value === value ? "text-accent" : "text-text-secondary",
                        )}
                        onClick={() => { onChange(opt.value); setSearch(""); setOpen(false); }}
                      >
                        <span className="flex-1 min-w-0 truncate">
                          <span className="font-mono text-xs">{opt.value}</span>
                          <span className="text-text-tertiary ml-2 text-xs">{opt.label}</span>
                        </span>
                        {opt.value === value && <Check size={12} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </Popover.Content>
      </Popover.Root>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export { Combobox };
export type { ComboboxProps, ComboboxOption };
