"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";

type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = { id: string; message: string; variant: ToastVariant };
type ToastContextValue = { toast: (message: string, variant?: ToastVariant) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={16} strokeWidth={2} />,
  error: <AlertCircle size={16} strokeWidth={2} />,
  warning: <AlertTriangle size={16} strokeWidth={2} />,
  info: <Info size={16} strokeWidth={2} />,
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="Notifications">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              role="alert"
              className={clsx(
                "min-w-80 max-w-md bg-surface border border-border-subtle rounded-lg shadow-lg p-4 flex items-start gap-3",
              )}
            >
              <span className={clsx("mt-0.5", ICON_COLORS[t.variant])}>{ICONS[t.variant]}</span>
              <p className="text-sm text-text-secondary flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-text-tertiary hover:text-text-primary p-0.5 cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
