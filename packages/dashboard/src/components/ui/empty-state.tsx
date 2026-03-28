import clsx from "clsx";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
};

function EmptyState({ title, description, action, icon, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center animate-fade-in",
        compact ? "py-8" : "py-16",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-text-primary">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-tertiary mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
