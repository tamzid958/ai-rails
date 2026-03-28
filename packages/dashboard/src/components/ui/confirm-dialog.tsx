"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "./button";
import clsx from "clsx";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", variant = "danger", loading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={clsx(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-xl p-0",
            "data-[state=open]:animate-scale-in",
          )}
        >
          <div className="p-6">
            <DialogPrimitive.Title className="text-lg font-semibold text-text-primary">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-text-tertiary mt-1.5">{description}</DialogPrimitive.Description>
          </div>
          <div className="flex justify-end gap-2 border-t border-border-subtle px-6 py-4">
            <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant={variant} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
